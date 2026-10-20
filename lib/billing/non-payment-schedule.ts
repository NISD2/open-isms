/**
 * Runs AGB B9 inside the app (./non-payment): every hour, an account whose invoice is unpaid past
 * its due date is suspended, and one whose invoice has since been paid is reopened. Started once
 * per server by instrumentation.ts, only on a deployed production server where ordering is on,
 * and under a Postgres advisory lock, so two containers during a deploy never act twice.
 *
 * Every change is audited and mailed to the operators, who decide whether to write to the
 * customer: B9 promises no notice, and the money is theirs to chase.
 */
import "@/lib/server-guard";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { isDeployedServer, withAdvisoryLock } from "@/lib/cron/in-app";
import { type DbOrTx, db } from "@/lib/db";
import { env } from "@/lib/env";
import { auditLog, billingAccount, creditNote, invoice, user } from "@/schema";
import type { AccessLevel } from "./accounts";
import { alertOperators } from "./alert";
import { readLiveInvoice } from "./invoice-status";
import {
  type Applied,
  type Candidate,
  type Change,
  type NonPaymentNotice,
  nonPaymentNotice,
  noticeNeedsQonto,
  type SweepResult,
  sweepNonPayment,
} from "./non-payment";
import { invoiceToday } from "./order";
import { orderingMode } from "./ordering";
import { revokeAccess } from "./subscriptions";

/** Payment by transfer is matched in Qonto within hours; an hour keeps reopening close to it. */
export const NON_PAYMENT_INTERVAL_MS = 60 * 60_000;
/** Lets a fresh server settle, and keeps a crash loop from hammering Qonto. */
const FIRST_RUN_DELAY_MS = 5 * 60_000;
/** Arbitrary, fixed, and used for nothing else. */
const NON_PAYMENT_LOCK = 7_346_201_906;

/** Invoices this server has seen paid; paid stays paid until a credit note, which ends the look. */
const seenPaid = new Set<string>();

/**
 * How long a page's notice reuses Qonto's answer. Every view of the billing or offer page asked
 * Qonto live, so a member reloading could use up the shared key's rate limit and leave the hourly
 * run unread, which delays a reopening. The run itself always asks live.
 */
const NOTICE_ANSWER_MS = 5 * 60_000;
const noticeAnswers = new Map<
  string,
  { readonly at: number; readonly live: Awaited<ReturnType<typeof readLiveInvoice>> }
>();

/** Qonto's answer for the notice: a readable one up to five minutes old, else a fresh one. */
const liveForNotice = async (
  mode: Parameters<typeof readLiveInvoice>[0],
  qontoInvoiceId: string,
) => {
  const kept = noticeAnswers.get(qontoInvoiceId);
  if (kept && Date.now() - kept.at < NOTICE_ANSWER_MS) return kept.live;
  const live = await readLiveInvoice(mode, qontoInvoiceId);
  // An unreadable answer is not kept: the next view asks again.
  if (live.status !== null) noticeAnswers.set(qontoInvoiceId, { at: Date.now(), live });
  return live;
};

/**
 * Every account with an invoice, or the one asked for, with its latest invoice: the newest issue
 * date, then the newest row.
 */
export const nonPaymentCandidates = async (
  tx: DbOrTx,
  accountId?: string,
): Promise<readonly (Candidate & { readonly holderEmail: string | null })[]> => {
  const rows = await tx
    .select({
      accountId: billingAccount.id,
      level: billingAccount.accessLevel,
      holderEmail: user.email,
      qontoInvoiceId: invoice.qontoInvoiceId,
      number: invoice.number,
      issueDate: invoice.issueDate,
      periodEnd: invoice.periodEnd,
      creditNoteId: creditNote.id,
    })
    .from(invoice)
    .innerJoin(billingAccount, eq(billingAccount.id, invoice.billingAccountId))
    .leftJoin(user, eq(user.id, billingAccount.ownerUserId))
    .leftJoin(creditNote, eq(creditNote.invoiceId, invoice.id))
    // An empty id must still filter: dropping the filter would read every account.
    .where(accountId !== undefined ? eq(billingAccount.id, accountId) : undefined)
    .orderBy(billingAccount.id, desc(invoice.issueDate), desc(invoice.createdAt));
  const latest = rows.filter((r, i) => i === 0 || rows[i - 1]?.accountId !== r.accountId);
  const reopenable = await suspendedByB9(
    tx,
    latest.filter((r) => r.level !== "full").map((r) => r.accountId),
  );
  return latest.map((r) => ({
    accountId: r.accountId,
    level: r.level,
    holderEmail: r.holderEmail,
    invoice: {
      qontoInvoiceId: r.qontoInvoiceId,
      number: r.number,
      issueDate: r.issueDate,
      periodEnd: r.periodEnd,
      credited: r.creditNoteId !== null,
    },
    reopenable: reopenable.has(r.accountId),
  }));
};

/** The audit actions that change an account's access: B9's two and the operator's revoke. */
const ACCESS_CHANGES = [
  "billing.access_suspended",
  "billing.access_reopened",
  "billing.access_revoked",
];

/**
 * The accounts whose latest access change is a B9 suspension, so a payment may reopen them. A
 * revoke by a person after it, or a reopening, ends that.
 */
const suspendedByB9 = async (
  tx: DbOrTx,
  accountIds: readonly string[],
): Promise<ReadonlySet<string>> => {
  if (accountIds.length === 0) return new Set();
  const rows = await tx
    .select({ accountId: auditLog.entityId, action: auditLog.action })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.entityType, "billing_account"),
        inArray(auditLog.action, ACCESS_CHANGES),
        inArray(auditLog.entityId, [...accountIds]),
      ),
    )
    .orderBy(desc(auditLog.createdAt));
  const newest = rows.filter(
    (r, i) => rows.findIndex((other) => other.accountId === r.accountId) === i,
  );
  return new Set(
    newest.flatMap((r) =>
      r.action === "billing.access_suspended" && r.accountId ? [r.accountId] : [],
    ),
  );
};

/**
 * What the open account is told about its latest invoice (`nonPaymentNotice`), with Qonto asked
 * only when a notice could apply: once the warning window may have begun, or while the account is
 * below full in a licence year its invoice pays for.
 */
export const nonPaymentNoticeOf = async (
  tx: DbOrTx,
  accountId: string,
  now = new Date(),
): Promise<(NonPaymentNotice & { readonly invoiceNumber: string }) | null> => {
  const mode = orderingMode(env);
  const [latest] = await nonPaymentCandidates(tx, accountId);
  const today = invoiceToday(now);
  if (mode.kind === "off" || !latest) return null;
  if (!noticeNeedsQonto(latest.level, latest.invoice, today)) return null;
  const live = await liveForNotice(mode, latest.invoice.qontoInvoiceId);
  const notice = nonPaymentNotice({ ...latest, ...live, today });
  return notice ? { ...notice, invoiceNumber: latest.invoice.number } : null;
};

/** B9's reopening: back to full, only from below full, so it never overwrites a person's change. */
const reopenAccess = async (tx: DbOrTx, billingAccountId: string): Promise<boolean> => {
  const reopened = await tx
    .update(billingAccount)
    .set({ accessLevel: "full", updatedAt: new Date() })
    .where(
      and(
        eq(billingAccount.id, billingAccountId),
        ne(billingAccount.accessLevel, "full"),
      ),
    )
    .returning({ id: billingAccount.id });
  return reopened.length === 1;
};

const WORDS = {
  suspend: {
    audit: "billing.access_suspended",
    subject: "B9: access suspended for an unpaid invoice",
  },
  reopen: {
    audit: "billing.access_reopened",
    subject: "B9: access reopened, the invoice is paid",
  },
} as const;

const lineOf = (change: Applied) =>
  `${change.action} billing account ${change.accountId}: invoice ${change.invoiceNumber}, due ${change.dueDate ?? "unknown"}, ${change.from} to ${change.level}`;

/**
 * Change the account and write its audit row in one transaction, so a suspension or a reopening
 * never stands without its record. The row is inserted directly rather than through `logAudit`,
 * which swallows a failed insert: here a failed row must undo the change and surface.
 */
const applyAndRecord = async <T>(
  change: Change,
  action: Applied["action"],
  apply: (
    tx: DbOrTx,
  ) => Promise<{ readonly level: AccessLevel; readonly result: T } | null>,
): Promise<T | null> =>
  db.transaction(async (tx) => {
    const done = await apply(tx);
    if (!done) return null;
    await tx.insert(auditLog).values({
      companyId: null,
      userId: null,
      action: WORDS[action].audit,
      entityType: "billing_account",
      entityId: change.accountId,
      description: `AGB B9 ${lineOf({ ...change, action, level: done.level })}`,
      previousValue: { accessLevel: change.from },
      newValue: { accessLevel: done.level },
    });
    return done.result;
  });

const report = async (change: Applied, holderEmail: string | null) => {
  const words = WORDS[change.action];
  const line = lineOf(change);
  await alertOperators(words.subject, [
    line,
    `Account holder: ${holderEmail ?? "none"}`,
    change.action === "suspend"
      ? "The invoice stays due. The account reopens by itself within the hour after Qonto shows it paid."
      : "Nothing to do unless you wrote to the customer about the suspension.",
  ]);
};

/** One run. Never throws: a failed run is logged, and the next one tries again. */
export async function nonPaymentOnce(now = new Date()): Promise<SweepResult | null> {
  const mode = orderingMode(env);
  if (mode.kind === "off" || !isDeployedServer()) return null;
  try {
    const locked = await withAdvisoryLock(NON_PAYMENT_LOCK, "non-payment", async () => {
      const candidates = await nonPaymentCandidates(db);
      const result = await sweepNonPayment({
        candidates,
        today: invoiceToday(now),
        seenPaid,
        read: (id) => readLiveInvoice(mode, id),
        suspend: (change) =>
          applyAndRecord(change, "suspend", async (tx) => {
            const level = await revokeAccess(tx, change.accountId, now);
            return level ? { level, result: level } : null;
          }),
        reopen: async (change) =>
          (await applyAndRecord(change, "reopen", async (tx) =>
            (await reopenAccess(tx, change.accountId))
              ? { level: "full", result: true }
              : null,
          )) ?? false,
      });
      for (const change of result.applied) {
        const holder = candidates.find((c) => c.accountId === change.accountId);
        await report(change, holder?.holderEmail ?? null);
      }
      return result;
    });
    if (!locked.locked) return null;
    const { applied, unreadable } = locked.value;
    if (applied.length > 0 || unreadable.length > 0) {
      // Unreadable means Qonto did not answer: nobody was locked out for it, but it shows here.
      (unreadable.length > 0 ? console.error : console.info)(
        `[non-payment] ${applied.length} changed, Qonto unreadable for ${unreadable.join(", ") || "none"}`,
      );
    }
    return locked.value;
  } catch (err) {
    console.error("[non-payment] run failed:", err);
    return null;
  }
}

/** Start the schedule. Does nothing where ordering is off or outside a deployed server. */
export function startNonPaymentSchedule(): void {
  if (orderingMode(env).kind === "off" || !isDeployedServer()) return;
  console.info(
    `[non-payment] scheduled: first run in ${FIRST_RUN_DELAY_MS / 60_000} min, then every ${NON_PAYMENT_INTERVAL_MS / 60_000} min`,
  );
  const tick = () => void nonPaymentOnce();
  setTimeout(() => {
    tick();
    setInterval(tick, NON_PAYMENT_INTERVAL_MS).unref();
  }, FIRST_RUN_DELAY_MS).unref();
}
