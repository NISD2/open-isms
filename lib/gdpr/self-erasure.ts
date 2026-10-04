/**
 * Whether a person may erase their own account from the user menu, and what goes with it.
 *
 * The same erasure as the platform admin's (./erase-user), with the cases one click must not decide
 * refused:
 *   - an owner whose organization has other members (those colleagues did not ask);
 *   - the payer of a billing account another set-up organization also uses (it would be left
 *     without anyone who can order, pay or cancel);
 *   - a payer with an order still under check in Qonto (its outcome is not known yet);
 *   - a payer whose licence can still be cancelled while billing is not open for them (the cancel
 *     cannot be made from here, so we make it);
 *   - an owner of several organizations (the engine refuses that itself);
 *   - platform admins.
 * Those write to contact@nisd2.eu and are handled with the admin tool.
 *
 * A licence that can still be cancelled does not stop it otherwise: deleting the account cancels it
 * first (cancelLicencesForErasure), because once the holder is gone nobody may cancel it. Invoices
 * do not stop it either. They are kept for the statutory period (§ 147 AO, § 14b UStG), which
 * Art. 17(3)(b) GDPR allows; the dialog says so beforehand and the certificate names them.
 *
 * The rules are checked three times: for the dialog, before the cancel, and again inside the
 * erasure's transaction (assertSelfErasureAllowed as eraseUser's guard), because each earlier
 * answer can be stale by the next step.
 */
import "@/lib/server-guard";
import { and, count, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  type CancelOutcome,
  cancelAuditDescription,
  cancelForErasure,
  openCancel,
} from "@/lib/billing/cancel";
import { type CancelNotice, sendCancelNotice } from "@/lib/billing/cancel-notice";
import { hasOrderCheck } from "@/lib/billing/order-check";
import { billingFor } from "@/lib/billing/ordering-access";
import type { Database, DbOrTx } from "@/lib/db";
import { billingAccount, company, companyMembership, invoice } from "@/schema";
import { ErasureRefused, erasureCompanyOf } from "./erase-user";

export type SelfErasureRefusal =
  | "platform_admin"
  | "several_organizations"
  | "pays_for_others"
  | "order_check"
  /** A licence still open at the erasure itself: the cancel made just before did not take. */
  | "cancel_first"
  /** A licence still open while billing is not open for them: the cancel goes through us. */
  | "cancel_by_us"
  /** The cancel made before the erasure failed in Qonto; nothing was deleted. */
  | "cancel_failed"
  /** Qonto did not answer the cancel clearly; nothing was deleted and the operators check it. */
  | "cancel_unclear"
  /** An order or cancel is running on the account right now; trying again in a minute works. */
  | "billing_busy"
  | "other_members"
  /** Not a rule about the account: the sign-in is too old (decided in the router). */
  | "reauth";

/** What deleting the account cancels first: money back inside the thirty days, else the renewal. */
export type LicenceCancel = "money_back" | "renewal";

export type SelfErasure =
  | {
      readonly allowed: true;
      /** The organization deleted with the account, when they own it; null otherwise. */
      readonly organization: string | null;
      /** Invoices were issued, so they stay on record after the erasure. */
      readonly invoicesKept: boolean;
      /** The paid licence the deletion cancels first; null when none is open. */
      readonly licence: LicenceCancel | null;
    }
  | { readonly allowed: false; readonly reason: SelfErasureRefusal };

type Person = { readonly userId: string; readonly email: string };

type OpenCancel = { readonly billingAccountId: string; readonly kind: LicenceCancel };

/** The check's answer, with the licences to cancel named by account for the server's own use. */
type Decision =
  | {
      readonly allowed: true;
      readonly organization: string | null;
      readonly invoicesKept: boolean;
      readonly cancels: readonly OpenCancel[];
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
 * The licences the person pays for that can still be cancelled (money back, or a renewal not yet
 * stopped), with the cancel each gets. Erasing the holder would leave them running with nobody who
 * may cancel them.
 */
const openCancelsOf = async (
  db: DbOrTx,
  userId: string,
  now: Date,
): Promise<OpenCancel[]> => {
  const held = await db
    .select({ id: billingAccount.id })
    .from(billingAccount)
    .where(eq(billingAccount.ownerUserId, userId));
  const options = await Promise.all(
    held.map(async ({ id }) => ({ id, option: await openCancel(db, id, now) })),
  );
  return options.flatMap(({ id, option }) =>
    option ? [{ billingAccountId: id, kind: option.kind }] : [],
  );
};

const licenceOf = (cancels: readonly OpenCancel[]): LicenceCancel | null =>
  cancels.some((c) => c.kind === "money_back")
    ? "money_back"
    : (cancels[0]?.kind ?? null);

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
const decide = async (db: DbOrTx, person: Person): Promise<Decision> => {
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
  // Last: a cancel cannot be undone, so it is made only when nothing else stands in the way. It
  // goes through the Billing page's cancel, which runs only while billing is open for this person.
  const cancels = await openCancelsOf(db, person.userId, new Date());
  if (cancels.length > 0 && !billingFor(person.email).open) {
    return { allowed: false, reason: "cancel_by_us" };
  }
  return {
    allowed: true,
    organization: scope.owned?.name ?? null,
    invoicesKept: accounts.length > 0 && (await anyInvoice(db, accounts)),
    cancels,
  };
};

/** The dialog's answer: whether they may, and what goes with the account. */
export async function selfErasureCheck(db: DbOrTx, person: Person): Promise<SelfErasure> {
  const decision = await decide(db, person);
  if (!decision.allowed) return decision;
  const { organization, invoicesKept, cancels } = decision;
  return { allowed: true, organization, invoicesKept, licence: licenceOf(cancels) };
}

/**
 * Cancels every licence the person pays for that is still open, just before their erasure, through
 * the cancel the Billing page uses (the credit note or the stopped renewal). Once the holder is
 * gone nobody may cancel it, and the money back or the stopped renewal would be lost. The
 * confirmations come back unsent, for the erasure confirmation to carry (./send-certificate).
 *
 * It cancels only when every other rule allows the erasure, so a refused deletion cancels nothing,
 * and a cancel that fails refuses the erasure with nothing deleted; the cancels made before it
 * stand, so their confirmations go out on their own. The cancel calls Qonto, so it runs before the
 * erasure's transaction, never inside it; the guard there refuses if one is still open. The audit
 * row names no IP or browser: the erasure would clear them a moment later.
 */
export async function cancelLicencesForErasure(
  db: Database,
  person: Person,
): Promise<readonly CancelNotice[]> {
  const decision = await decide(db, person);
  if (!decision.allowed) throw new SelfErasureRefused(decision.reason);
  if (decision.cancels.length === 0) return [];
  const { mode, open } = billingFor(person.email);
  if (!open || mode.kind === "off") throw new SelfErasureRefused("cancel_by_us");
  const notices: CancelNotice[] = [];
  try {
    // One after the other: each cancel holds its account across the Qonto call.
    for (const { billingAccountId } of decision.cancels) {
      const { outcome, notice } = await cancelForErasure({
        db,
        mode,
        billingAccountId,
        userId: person.userId,
      });
      if (notice) notices.push(notice);
      if (outcome.ok) {
        await logAudit({
          companyId: null,
          userId: person.userId,
          action: "billing.cancel",
          entityType: "billing_account",
          entityId: billingAccountId,
          description: `${cancelAuditDescription(outcome)}, as the holder deleted their account`,
          ipAddress: null,
          userAgent: null,
        });
      } else if (outcome.reason !== "no_invoice") {
        // no_invoice means it was cancelled meanwhile, so there is nothing left to do for it.
        console.error(`[self-erasure] cancel before erasure failed: ${outcome.message}`);
        throw new SelfErasureRefused(REFUSAL_FOR[outcome.reason]);
      }
    }
  } catch (err) {
    // A refusal or an error part way: the cancels made so far stand, and so does the account.
    await Promise.all(notices.map(sendCancelNotice));
    throw err;
  }
  return notices;
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
  (person: Person) =>
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
    const decision = await decide(tx, person);
    if (!decision.allowed) throw new SelfErasureRefused(decision.reason);
    // cancelLicencesForErasure ran just before: a licence still open here did not get cancelled.
    if (decision.cancels.length > 0) throw new SelfErasureRefused("cancel_first");
  };

/** What the dialog says when the cancel before the erasure did not go through. */
const REFUSAL_FOR = {
  pending: "billing_busy",
  qonto: "cancel_failed",
  // The credit note may exist; the order-check mark refuses a retry until an operator has looked.
  qonto_unknown: "cancel_unclear",
} as const satisfies Record<
  Exclude<Extract<CancelOutcome, { ok: false }>["reason"], "no_invoice">,
  SelfErasureRefusal
>;

/** Postgres lock_not_available, raised by NOWAIT when the row is locked. */
const LOCK_NOT_AVAILABLE = "55P03";

/** The Postgres error code on a driver error or the query error wrapping it. */
const pgCodeOf = (err: unknown): string | undefined => {
  const source = err instanceof Error && typeof err.cause === "object" ? err.cause : err;
  return source && typeof source === "object" && "code" in source
    ? String((source as { code: unknown }).code)
    : undefined;
};
