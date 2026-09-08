/**
 * Generic lifecycle-email dispatcher: transport gate, race-proof claim,
 * send, bookkeeping. Email types stay declarative (registry.ts); everything
 * that must be correct — never double-sending above all — lives here once.
 *
 * Delivery contract per (user, type.key):
 *   1. Claim: insert the notification row FIRST, with onConflictDoNothing
 *      against the partial unique index uq_notification_lifecycle_once. No
 *      returned row = someone already claimed (a prior run, or a concurrent
 *      one) = skip. This is what makes double-sends impossible: the database
 *      arbitrates, not query timing.
 *   2. Send. On success the claim row already says sent.
 *   3. On transport failure the claim row STAYS — the request may have
 *      reached Resend before failing, and "never double-send" outranks
 *      "always send". The row is marked urgency='warning' so failures are
 *      queryable, and an audit row (email.lifecycle_failed) points ops at
 *      it; deleting the row by hand re-arms that one user. Same trade-off
 *      as the course-reminders cron.
 *   4. Suppressed sends (dev-block, DISABLE_EMAIL, missing API key) cannot
 *      burn claims: the run-level gate returns early, and should suppression
 *      somehow flip mid-run, the provably-unsent claim is released.
 *
 * Only one run executes at a time per process: overlapping invocations (a
 * manual curl during the daily run, a scheduler double-fire) would stack
 * send loops past Resend's rate limit and 429-fail claims that are then
 * never retried. An in-process guard is sufficient because the app deploys
 * as a single container — the same assumption the in-memory auth rate
 * limiters already make.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import type { DbOrTx } from "@/lib/db";
import { mailSupportEmail } from "@/lib/env";
import { isSuppressedSendId, mailSuppressionReason, sendMail } from "@/lib/mail/send";
import { notification, user } from "@/schema";
import { LIFECYCLE_EMAIL_TYPES } from "./registry";
import {
  LIFECYCLE_ENTITY_TYPE,
  type LifecycleEmailType,
  type PreparedLifecycleEmail,
} from "./types";

/** Resend's default rate limit is ~2 requests/second. */
const SEND_INTERVAL_MS = 600;

/**
 * Per-type, per-run send cap. The first production run meets every dormant
 * account at once; capping spreads that backlog over daily runs instead of
 * bursting hundreds of emails in one minute. The remainder is reported as
 * `deferred`, never dropped — tomorrow's run picks it up.
 */
const MAX_SENDS_PER_TYPE_PER_RUN = 100;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface LifecycleTypeStats {
  prepared: number;
  sent: number;
  failed: number;
  alreadyClaimed: number;
  released: number;
  optedOut: number;
  deferred: number;
  error?: string;
  /** Dry runs only: who the batch WOULD have gone to, nothing sent or claimed. */
  wouldSend?: Array<{ to: string; subject: string }>;
}

export interface LifecycleRunOptions {
  sendIntervalMs?: number;
  /**
   * Select and render, but claim nothing and send nothing; report the batch
   * as `wouldSend`. The canary step before the first real run.
   */
  dryRun?: boolean;
  /**
   * Lower the per-type batch below MAX_SENDS_PER_TYPE_PER_RUN for a manual
   * ramp-up (first real run to 1 person, then 5, then 25). Can only lower —
   * values above the cap are clamped down.
   */
  maxPerType?: number;
}

export type LifecycleRunResult =
  | { skipped: string }
  | { skipped?: undefined; types: Record<string, LifecycleTypeStats> };

type DeliveryOutcome = "sent" | "already_claimed" | "released" | "opted_out" | "failed";

async function deliverOne(
  db: DbOrTx,
  type: LifecycleEmailType,
  email: PreparedLifecycleEmail,
): Promise<DeliveryOutcome> {
  // Re-check the opt-out flag right before claiming: prepare() snapshots
  // eligibility for the whole batch, and the throttled loop can run for a
  // minute — long enough for someone to click unsubscribe on that morning's
  // digest. One indexed PK read shrinks that window to milliseconds.
  const recipient = await db.query.user.findFirst({
    where: eq(user.id, email.userId),
    columns: { emailFollowupsDisabled: true },
  });
  if (!recipient || recipient.emailFollowupsDisabled) return "opted_out";

  const now = new Date();
  const claimed = await db
    .insert(notification)
    .values({
      companyId: email.companyId,
      recipientId: email.userId,
      entityType: LIFECYCLE_ENTITY_TYPE,
      entityId: email.userId,
      triggerField: type.key,
      subject: email.subject,
      body: email.note,
      channel: "email" as const,
      // "sent" up front, not "pending": the claim is the permanent dedup
      // record, and the deadlines cron bulk-flips any due pending email row
      // to sent anyway, so a pending claim would not survive as pending.
      status: "sent" as const,
      scheduledFor: now,
      sentAt: now,
      urgency: "info" as const,
      escalationLevel: 0,
      linkUrl: email.linkUrl,
    })
    .onConflictDoNothing()
    .returning({ id: notification.id });
  const claim = claimed[0];
  if (!claim) return "already_claimed";

  const result = await sendMail({
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    replyTo: mailSupportEmail(),
    unsubscribeUrl: email.unsubscribeUrl,
    // Keyed on the claim row: sendMail's retry loop re-POSTs on ambiguous
    // network failures, and without this a request Resend accepted (response
    // lost) would deliver a second copy on the retry — the one double-send
    // the DB claim cannot arbitrate, because both attempts run under it.
    idempotencyKey: `lifecycle/${claim.id}`,
  });

  if (result.success && !isSuppressedSendId(result.id)) return "sent";

  if (result.success) {
    // Suppression engaged between the run-level gate and this send. Nothing
    // left the box, so the claim is safe to release for a future run.
    await db.delete(notification).where(eq(notification.id, claim.id));
    return "released";
  }

  // Mark the kept claim so failed sends are queryable (the row must keep
  // status 'sent' — see the insert above — but urgency is free to carry the
  // signal). Best-effort: a marker failure must not fail the delivery loop.
  await db
    .update(notification)
    .set({ urgency: "warning" })
    .where(eq(notification.id, claim.id))
    .catch(() => {});

  // userId stays null by cron convention: audit rows with a non-null userId
  // mean "a person did something" (journey idle detection and this
  // subsystem's own dormancy check both rely on that), and a failed send is
  // not the recipient's action.
  logAudit({
    companyId: email.companyId,
    userId: null,
    action: "email.lifecycle_failed",
    entityType: "notification",
    entityId: claim.id,
    description: `Lifecycle email ${type.key} to ${email.to} failed after retries; claim row kept (urgency=warning), delete it to re-arm this user`,
  });
  return "failed";
}

async function runType(
  db: DbOrTx,
  type: LifecycleEmailType,
  opts: { sendIntervalMs: number; dryRun: boolean; maxPerType: number },
): Promise<LifecycleTypeStats> {
  const stats: LifecycleTypeStats = {
    prepared: 0,
    sent: 0,
    failed: 0,
    alreadyClaimed: 0,
    released: 0,
    optedOut: 0,
    deferred: 0,
  };

  const prepared = await type.prepare(db);
  stats.prepared = prepared.length;
  const cap = Math.min(MAX_SENDS_PER_TYPE_PER_RUN, Math.max(1, opts.maxPerType));
  const batch = prepared.slice(0, cap);
  stats.deferred = prepared.length - batch.length;

  if (opts.dryRun) {
    stats.wouldSend = batch.map((email) => ({ to: email.to, subject: email.subject }));
    return stats;
  }

  for (const [index, email] of batch.entries()) {
    try {
      const outcome = await deliverOne(db, type, email);
      if (outcome === "sent") stats.sent++;
      else if (outcome === "already_claimed") stats.alreadyClaimed++;
      else if (outcome === "released") stats.released++;
      else if (outcome === "opted_out") stats.optedOut++;
      else stats.failed++;
    } catch (err) {
      stats.failed++;
      // userId null: cron convention, see the failure branch in deliverOne.
      logAudit({
        companyId: email.companyId,
        userId: null,
        action: "email.lifecycle_failed",
        entityType: "notification",
        entityId: null,
        description: `Lifecycle email ${type.key} to ${email.to} threw: ${err instanceof Error ? err.message : "unknown"}`,
      });
    }
    if (index < batch.length - 1) await wait(opts.sendIntervalMs);
  }
  return stats;
}

/**
 * The in-flight run, or null. Overlap guard — see the header. Cleared in the
 * finally below, so a crashed run never wedges the next one.
 */
let activeRun: Promise<LifecycleRunResult> | null = null;

export async function runLifecycleEmails(
  db: DbOrTx,
  opts?: LifecycleRunOptions,
): Promise<LifecycleRunResult> {
  const suppression = mailSuppressionReason();
  if (suppression) {
    return { skipped: `email transport unavailable (${suppression})` };
  }
  if (activeRun) {
    return { skipped: "a lifecycle run is already in progress" };
  }

  const run = executeRun(db, {
    sendIntervalMs: opts?.sendIntervalMs ?? SEND_INTERVAL_MS,
    dryRun: opts?.dryRun ?? false,
    maxPerType: opts?.maxPerType ?? MAX_SENDS_PER_TYPE_PER_RUN,
  });
  activeRun = run;
  try {
    return await run;
  } finally {
    activeRun = null;
  }
}

async function executeRun(
  db: DbOrTx,
  opts: { sendIntervalMs: number; dryRun: boolean; maxPerType: number },
): Promise<LifecycleRunResult> {
  const types: Record<string, LifecycleTypeStats> = {};
  for (const type of LIFECYCLE_EMAIL_TYPES) {
    try {
      types[type.key] = await runType(db, type, opts);
    } catch (err) {
      // One broken type must not silence the others.
      types[type.key] = {
        prepared: 0,
        sent: 0,
        failed: 0,
        alreadyClaimed: 0,
        released: 0,
        optedOut: 0,
        deferred: 0,
        error: err instanceof Error ? err.message : "unknown",
      };
    }
  }
  return { types };
}
