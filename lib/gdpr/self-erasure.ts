/**
 * Whether a person may erase their own account from the user menu, and what goes with it.
 *
 * The same erasure as the platform admin's (./erase-user), with the cases one click must not decide
 * refused: an owner whose organization has other members (those colleagues did not ask), a payer
 * with a running licence or an order under check (the contract and its invoices outlive the
 * account), an owner of several organizations (the engine refuses that itself), and platform
 * admins. Those write to contact@nisd2.eu and are handled with the admin tool.
 */
import "@/lib/server-guard";
import { and, count, eq, ne } from "drizzle-orm";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { hasOrderCheck } from "@/lib/billing/order-check";
import { findActiveInvoice } from "@/lib/billing/place-order";
import type { DbOrTx } from "@/lib/db";
import { billingAccount, companyMembership } from "@/schema";
import { ErasureRefused, erasureCompanyOf } from "./erase-user";

export type SelfErasureRefusal =
  | "platform_admin"
  | "several_organizations"
  | "running_licence"
  | "other_members";

export type SelfErasure =
  | {
      readonly allowed: true;
      /** The organization deleted with the account, when they own it; null otherwise. */
      readonly organization: string | null;
    }
  | { readonly allowed: false; readonly reason: SelfErasureRefusal };

const hasRunningLicence = async (db: DbOrTx, userId: string, now: Date) => {
  const accounts = await db
    .select({ id: billingAccount.id })
    .from(billingAccount)
    .where(eq(billingAccount.ownerUserId, userId));
  const running = await Promise.all(
    accounts.map(
      async ({ id }) =>
        (await findActiveInvoice(db, id, now)) !== null || (await hasOrderCheck(db, id)),
    ),
  );
  return running.some(Boolean);
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

/** Decides from the database, every time: the dialog's answer is never trusted at deletion. */
export async function selfErasureCheck(
  db: DbOrTx,
  person: { readonly userId: string; readonly email: string },
  now: Date = new Date(),
): Promise<SelfErasure> {
  if (isPlatformAdmin(person.email)) return { allowed: false, reason: "platform_admin" };
  const scope = await erasureCompanyOf(db, person.userId).catch((err: unknown) => {
    if (err instanceof ErasureRefused) return null;
    throw err;
  });
  if (!scope) return { allowed: false, reason: "several_organizations" };
  if (await hasRunningLicence(db, person.userId, now)) {
    return { allowed: false, reason: "running_licence" };
  }
  if (scope.owned && (await otherMemberCount(db, scope.owned.id, person.userId)) > 0) {
    return { allowed: false, reason: "other_members" };
  }
  return { allowed: true, organization: scope.owned?.name ?? null };
}
