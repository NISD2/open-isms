/**
 * Whether a person may erase their own account from the user menu, and what goes with it.
 *
 * The same erasure as the platform admin's (./erase-user), with the cases one click must not decide
 * refused:
 *   - an owner whose organization has other members (those colleagues did not ask);
 *   - the payer of a billing account another set-up organization also uses (it would be left
 *     without anyone who can order, pay or cancel);
 *   - a payer with an order still under check in Qonto (its outcome is not known yet);
 *   - a payer whose licence can still be cancelled (they cancel under Billing first: once the
 *     holder is gone, nobody may cancel it, and the money back or the stopped renewal is lost);
 *   - an owner of several organizations (the engine refuses that itself);
 *   - platform admins.
 * Those write to contact@nisd2.eu and are handled with the admin tool.
 *
 * Invoices do not stop it. They are kept for the statutory period (§ 147 AO, § 14b UStG), which
 * Art. 17(3)(b) GDPR allows; the dialog says so beforehand and the certificate names them.
 *
 * The rules are checked twice: for the dialog, and again inside the erasure's transaction
 * (assertSelfErasureAllowed as eraseUser's guard), because the dialog's answer can be stale.
 */
import "@/lib/server-guard";
import { and, count, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { hasOpenCancel } from "@/lib/billing/cancel";
import { hasOrderCheck } from "@/lib/billing/order-check";
import { billingFor } from "@/lib/billing/ordering-access";
import type { DbOrTx } from "@/lib/db";
import { billingAccount, company, companyMembership, invoice } from "@/schema";
import { ErasureRefused, erasureCompanyOf } from "./erase-user";

export type SelfErasureRefusal =
  | "platform_admin"
  | "several_organizations"
  | "pays_for_others"
  | "order_check"
  /** A paid licence that can still be cancelled: cancel under Billing first, then delete. */
  | "cancel_first"
  /** The same, while billing is not open for them: the cancel goes through contact@nisd2.eu. */
  | "cancel_by_us"
  /** An order or cancel is running on the account right now; trying again in a minute works. */
  | "billing_busy"
  | "other_members"
  /** Not a rule about the account: the sign-in is too old (decided in the router). */
  | "reauth";

export type SelfErasure =
  | {
      readonly allowed: true;
      /** The organization deleted with the account, when they own it; null otherwise. */
      readonly organization: string | null;
      /** Invoices were issued, so they stay on record after the erasure. */
      readonly invoicesKept: boolean;
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

/** The billing accounts the erasure touches: the ones the person pays for and their own org's. */
const accountsOf = async (db: DbOrTx, userId: string, ownedCompanyId: string | null) =>
  (
    await db
      .select({ id: billingAccount.id })
      .from(billingAccount)
      .where(
        or(
          eq(billingAccount.ownerUserId, userId),
          ownedCompanyId
            ? inArray(
                billingAccount.id,
                db
                  .select({ id: company.billingAccountId })
                  .from(company)
                  .where(eq(company.id, ownedCompanyId)),
              )
            : undefined,
        ),
      )
  ).map((a) => a.id);

/** Another set-up organization pays through one of these accounts; a draft is left ownerless. */
const paysForOthers = (
  db: DbOrTx,
  ids: readonly string[],
  ownedCompanyId: string | null,
) =>
  exists(
    db
      .select({ id: company.id })
      .from(company)
      .where(
        and(
          inArray(company.billingAccountId, [...ids]),
          isNotNull(company.activatedAt),
          ownedCompanyId ? ne(company.id, ownedCompanyId) : undefined,
        ),
      )
      .limit(1),
  );

const anyOrderCheck = async (db: DbOrTx, ids: readonly string[]) =>
  (await Promise.all(ids.map((id) => hasOrderCheck(db, id)))).some(Boolean);

const anyInvoice = (db: DbOrTx, ids: readonly string[]) =>
  exists(
    db
      .select({ id: invoice.id })
      .from(invoice)
      .where(inArray(invoice.billingAccountId, [...ids]))
      .limit(1),
  );

/**
 * A licence the person pays for that can still be cancelled (money back, or a renewal not yet
 * stopped). Erasing the holder would leave it running with nobody who may cancel it, so they cancel
 * first, through the one cancel path that issues the credit note and the emails.
 */
const anyOpenCancel = async (db: DbOrTx, userId: string, now: Date) => {
  const held = await db
    .select({ id: billingAccount.id })
    .from(billingAccount)
    .where(eq(billingAccount.ownerUserId, userId));
  return (await Promise.all(held.map(({ id }) => hasOpenCancel(db, id, now)))).some(
    Boolean,
  );
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
  const accounts = await accountsOf(db, person.userId, ownedId);
  if (accounts.length > 0 && (await paysForOthers(db, accounts, ownedId))) {
    return { allowed: false, reason: "pays_for_others" };
  }
  if (await anyOrderCheck(db, accounts)) return { allowed: false, reason: "order_check" };
  if (ownedId && (await otherMemberCount(db, ownedId, person.userId)) > 0) {
    return { allowed: false, reason: "other_members" };
  }
  // Last: a cancel cannot be undone, so it is asked for only when nothing else stands in the way.
  if (await anyOpenCancel(db, person.userId, new Date())) {
    // The Billing page offers the cancel only while billing is open for this person; otherwise
    // sending them there is a dead end, so they write to us instead.
    const { open } = await billingFor(db, person.email);
    return { allowed: false, reason: open ? "cancel_first" : "cancel_by_us" };
  }
  return {
    allowed: true,
    organization: scope.owned?.name ?? null,
    invoicesKept: accounts.length > 0 && (await anyInvoice(db, accounts)),
  };
}

/**
 * eraseUser's guard for a self-service erasure: the same rules, at the moment of erasure.
 *
 * The rows the rules count are locked first, so they hold until the erasure commits: the
 * organizations the person owns (a membership insert takes KEY SHARE on its company, so an invite
 * accepted meanwhile waits, then fails on the deleted company instead of being torn down with it),
 * and the billing accounts they pay for.
 *
 * The billing lock does not wait. An order or a cancel holds its account (NO KEY UPDATE) across the
 * Qonto call and then inserts an invoice or credit note naming this user, which needs KEY SHARE on
 * the user row eraseUser already holds: waiting here would be a cycle, and Postgres would abort the
 * order after Qonto had issued the invoice. A billing action in flight refuses for now instead.
 */
export const assertSelfErasureAllowed =
  (person: { readonly userId: string; readonly email: string }) =>
  async (tx: DbOrTx): Promise<void> => {
    await tx
      .select({ id: company.id })
      .from(company)
      .where(eq(company.ownerId, person.userId))
      .for("update");
    // Every account the check reads: the ones they pay for and the ones their organizations use.
    await tx
      .select({ id: billingAccount.id })
      .from(billingAccount)
      .where(
        or(
          eq(billingAccount.ownerUserId, person.userId),
          inArray(
            billingAccount.id,
            tx
              .select({ id: company.billingAccountId })
              .from(company)
              .where(eq(company.ownerId, person.userId)),
          ),
        ),
      )
      .for("share", { noWait: true })
      .catch((err: unknown) => {
        if (pgCodeOf(err) === LOCK_NOT_AVAILABLE) {
          throw new SelfErasureRefused("billing_busy");
        }
        throw err;
      });
    const check = await selfErasureCheck(tx, person);
    if (!check.allowed) throw new SelfErasureRefused(check.reason);
  };

/** Postgres lock_not_available, raised by NOWAIT when the row is locked. */
const LOCK_NOT_AVAILABLE = "55P03";

/** The Postgres error code on a driver error or the query error wrapping it. */
const pgCodeOf = (err: unknown): string | undefined => {
  const source = err instanceof Error && typeof err.cause === "object" ? err.cause : err;
  return source && typeof source === "object" && "code" in source
    ? String((source as { code: unknown }).code)
    : undefined;
};
