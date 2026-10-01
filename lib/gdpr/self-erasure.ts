/**
 * Whether a person may erase their own account from the user menu, and what goes with it.
 *
 * The same erasure as the platform admin's (./erase-user), with the cases one click must not decide
 * refused:
 *   - an owner whose organization has other members (those colleagues did not ask);
 *   - the payer of a billing account that has invoices, an order under check, or another
 *     organization on it (invoices are kept for § 14b UStG, which the certificate would have to
 *     explain, and another organization would be left without anyone who can pay);
 *   - an owner of several organizations (the engine refuses that itself);
 *   - platform admins.
 * Those write to contact@nisd2.eu and are handled with the admin tool.
 *
 * The rules are checked twice: for the dialog, and again inside the erasure's transaction
 * (assertSelfErasureAllowed as eraseUser's guard), because the dialog's answer can be stale.
 */
import "@/lib/server-guard";
import { and, count, eq, isNotNull, ne } from "drizzle-orm";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { hasOrderCheck } from "@/lib/billing/order-check";
import type { DbOrTx } from "@/lib/db";
import { billingAccount, company, companyMembership, invoice } from "@/schema";
import { ErasureRefused, erasureCompanyOf } from "./erase-user";

export type SelfErasureRefusal =
  | "platform_admin"
  | "several_organizations"
  | "billing"
  | "other_members"
  /** Not a rule about the account: the sign-in is too old (decided in the router). */
  | "reauth";

export type SelfErasure =
  | {
      readonly allowed: true;
      /** The organization deleted with the account, when they own it; null otherwise. */
      readonly organization: string | null;
    }
  | { readonly allowed: false; readonly reason: SelfErasureRefusal };

/** Thrown inside the erasure's transaction when the rules no longer allow it; rolls it back. */
export class SelfErasureRefused extends Error {
  override name = "SelfErasureRefused";
  constructor(readonly reason: SelfErasureRefusal) {
    super(reason);
  }
}

const exists = async (rows: Promise<readonly unknown[]>) => (await rows).length > 0;

/** A billing account this person pays for that the erasure cannot simply leave behind. */
const hasBillingTies = async (
  db: DbOrTx,
  userId: string,
  ownedCompanyId: string | null,
) => {
  const accounts = await db
    .select({ id: billingAccount.id })
    .from(billingAccount)
    .where(eq(billingAccount.ownerUserId, userId));
  const tied = await Promise.all(
    accounts.map(
      async ({ id }) =>
        (await exists(
          db
            .select({ id: invoice.id })
            .from(invoice)
            .where(eq(invoice.billingAccountId, id))
            .limit(1),
        )) ||
        (await hasOrderCheck(db, id)) ||
        // Another set-up organization on it; a never set-up draft is left ownerless by design.
        (await exists(
          db
            .select({ id: company.id })
            .from(company)
            .where(
              and(
                eq(company.billingAccountId, id),
                isNotNull(company.activatedAt),
                ownedCompanyId ? ne(company.id, ownedCompanyId) : undefined,
              ),
            )
            .limit(1),
        )),
    ),
  );
  return tied.some(Boolean);
};

const otherMemberCount = async (db: DbOrTx, companyId: string, userId: string) => {
  const [row] = await db
    .select({ n: count() })
    .from(companyMembership)
    .where(
      and(
        eq(companyMembership.companyId, companyId),
        ne(companyMembership.userId, userId),
      ),
    );
  return row?.n ?? 0;
};

/** Decides from the database, every time. */
export async function selfErasureCheck(
  db: DbOrTx,
  person: { readonly userId: string; readonly email: string },
): Promise<SelfErasure> {
  if (isPlatformAdmin(person.email)) return { allowed: false, reason: "platform_admin" };
  const scope = await erasureCompanyOf(db, person.userId).catch((err: unknown) => {
    if (err instanceof ErasureRefused) return null;
    throw err;
  });
  if (!scope) return { allowed: false, reason: "several_organizations" };
  const ownedId = scope.owned?.id ?? null;
  if (await hasBillingTies(db, person.userId, ownedId)) {
    return { allowed: false, reason: "billing" };
  }
  if (ownedId && (await otherMemberCount(db, ownedId, person.userId)) > 0) {
    return { allowed: false, reason: "other_members" };
  }
  return { allowed: true, organization: scope.owned?.name ?? null };
}

/** eraseUser's guard for a self-service erasure: the same rules, at the moment of erasure. */
export const assertSelfErasureAllowed =
  (person: { readonly userId: string; readonly email: string }) =>
  async (tx: DbOrTx): Promise<void> => {
    const check = await selfErasureCheck(tx, person);
    if (!check.allowed) throw new SelfErasureRefused(check.reason);
  };
