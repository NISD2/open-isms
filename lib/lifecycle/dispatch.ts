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
 *      "always send". An audit row (email.lifecycle_failed) points ops at
 *      it; deleting the row by hand re-arms that one user. Same trade-off
 *      as the course-reminders cron.
 *   4. Suppressed sends (dev-block, DISABLE_EMAIL, missing API key) cannot
 *      burn claims: the run-level gate returns early, and should suppression
 *      somehow flip mid-run, the provably-unsent claim is released.
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

  logAudit({
    companyId: email.companyId,
    userId: email.userId,
    action: "email.lifecycle_failed",
    entityType: "notification",
    entityId: claim.id,
    description: `Lifecycle email ${type.key} to ${email.to} failed after retries; claim row kept, delete it to re-arm this user`,
  });
  return "failed";
}

async function runType(
  db: DbOrTx,
  type: LifecycleEmailType,
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
  const batch = prepared.slice(0, MAX_SENDS_PER_TYPE_PER_RUN);
  stats.deferred = prepared.length - batch.length;

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
      logAudit({
        companyId: email.companyId,
        userId: email.userId,
        action: "email.lifecycle_failed",
        entityType: "notification",
        entityId: null,
        description: `Lifecycle email ${type.key} to ${email.to} threw: ${err instanceof Error ? err.message : "unknown"}`,
      });
    }
    if (index < batch.length - 1) await wait(SEND_INTERVAL_MS);
  }
  return stats;
}

export async function runLifecycleEmails(db: DbOrTx): Promise<LifecycleRunResult> {
  const suppression = mailSuppressionReason();
  if (suppression) {
    return { skipped: `email transport unavailable (${suppression})` };
  }

  const types: Record<string, LifecycleTypeStats> = {};
  for (const type of LIFECYCLE_EMAIL_TYPES) {
    try {
      types[type.key] = await runType(db, type);
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
