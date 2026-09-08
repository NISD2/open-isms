/**
 * The digest outbox: what the deadline digests WOULD say right now, and the
 * one path that sends them.
 *
 * Digests used to go out from inside the nightly cron. They no longer do —
 * nothing at nisd2.eu mails a customer without a person pressing a button,
 * and a job that quietly emails everybody as a side effect of doing
 * bookkeeping is the exact shape of thing that rule exists to prevent. The
 * cron still runs the other six phases (status transitions, deadline
 * backfill, reminder scheduling, escalation, supplier broadcasts, GDPR
 * retention); only the sending moved here.
 *
 * Nothing is precomputed or stored. A digest is a view of the tenant's
 * current state, so building it at send time is both simpler and more
 * correct than queueing a snapshot that can go stale between the operator
 * reading it and pressing send.
 *
 * Unlike the lifecycle campaign the claim is not once-EVER — a digest is
 * meant to recur — but there is still a claim: one row per recipient per
 * digest kind per UTC day, inserted before the send. That is what makes the
 * queue drain after a batch and what stops a second press, or a second
 * browser tab, mailing somebody the same digest twice. Without it the panel
 * kept showing the same people as "waiting" after they had been mailed,
 * which invites exactly the duplicate send it looks like it is warning about.
 */
import "@/lib/server-guard";
import { and, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { compileDailyDigest, compileManagementDigest } from "@/lib/compliance/digest";
import type { Database } from "@/lib/db";
import { loadEmailConsent } from "@/lib/mail/consent";
import type { UserConsentEmailTypeId } from "@/lib/mail/email-types";
import { preferenceFooterFor } from "@/lib/mail/footer";
import { isSuppressedSendId, mailSuppressionReason, sendMail } from "@/lib/mail/send";
import { dailyDigestEmail, weeklyManagementDigestEmail } from "@/lib/mail/templates";
import { company, notification, user } from "@/schema";

export type DigestKind = "daily" | "weekly";

export interface QueuedDigest {
  kind: DigestKind;
  userId: string;
  email: string;
  companyId: string;
  companyName: string;
  subject: string;
  /** One line the operator can scan: what this person is being told. */
  summary: string;
}

// Narrowed to the gated ids on purpose: sendMail only accepts a
// recipientUserId alongside a user-consent type, so widening this would stop
// the digests going through the consent gate at all.
const EMAIL_TYPE: Record<DigestKind, UserConsentEmailTypeId> = {
  daily: "reminders.daily_digest",
  weekly: "reminders.weekly_management_digest",
};

/** notification.entityType per kind; the partial unique index keys on these. */
const ENTITY_TYPE: Record<DigestKind, string> = {
  daily: "daily_digest",
  weekly: "weekly_management_digest",
};

/** UTC day, so "already sent today" means the same thing everywhere. */
function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function digestClaimKey(userId: string, kind: DigestKind): string {
  return `${userId}:${kind}`;
}

/**
 * Recipients who already received each digest kind today, as claim keys.
 * Read once per queue build rather than per member: a send loop over every
 * member of every company would otherwise issue one query each.
 */
async function loadTodaysDigestRecipients(db: Database): Promise<Set<string>> {
  const startOfDay = new Date(`${utcDay()}T00:00:00.000Z`);
  const rows = await db
    .select({
      recipientId: notification.recipientId,
      entityType: notification.entityType,
    })
    .from(notification)
    .where(
      and(
        inArray(notification.entityType, [ENTITY_TYPE.daily, ENTITY_TYPE.weekly]),
        gte(notification.createdAt, startOfDay),
      ),
    );

  const sent = new Set<string>();
  for (const row of rows) {
    if (!row.recipientId) continue;
    const kind: DigestKind = row.entityType === ENTITY_TYPE.daily ? "daily" : "weekly";
    sent.add(digestClaimKey(row.recipientId, kind));
  }
  return sent;
}

/**
 * Everyone with a digest worth sending right now.
 *
 * Draft companies are excluded (activatedAt IS NULL): they hold seeded
 * assessment rows but no real work, so a digest would mail every drive-by
 * signup a blank-named 0% report. Recipients who opted out are excluded here
 * too — the gate inside sendMail would refuse them anyway, but an operator
 * reviewing a queue should not be shown people who will not receive it.
 *
 * The weekly management digest is offered for management and admins
 * whenever it has content. It used to be Monday-only because a cron had to
 * pick a day; a person pressing a button picks the day themselves.
 */
export async function buildDigestQueue(db: Database): Promise<QueuedDigest[]> {
  const companies = await db.query.company.findMany({
    // actsAsNis2Entity as well as activated: a supplier-portal signup is a
    // real, activated company that is explicitly NOT in NIS 2 scope, and
    // mailing it a NIS 2 compliance report is both wrong and alarming.
    where: and(isNotNull(company.activatedAt), eq(company.actsAsNis2Entity, true)),
    columns: { id: true, name: true },
  });

  // Who already got which digest today. This is what drains the queue: a
  // recipient mailed an hour ago must not still read as "waiting", or the
  // operator presses send again and mails them a second identical copy.
  const alreadySentToday = await loadTodaysDigestRecipients(db);

  const queue: QueuedDigest[] = [];
  for (const co of companies) {
    const members = await db.query.user.findMany({
      where: eq(user.companyId, co.id),
      columns: { id: true, email: true, isManagement: true, role: true },
    });

    for (const member of members) {
      const consent = await loadEmailConsent(db, member.id);

      if (
        consent.allows(EMAIL_TYPE.daily) &&
        !alreadySentToday.has(digestClaimKey(member.id, "daily"))
      ) {
        const digest = await compileDailyDigest(db, member.id, co.id);
        if (digest) {
          queue.push({
            kind: "daily",
            userId: member.id,
            email: digest.recipientEmail,
            companyId: co.id,
            companyName: co.name,
            subject: dailyDigestEmail({
              recipientName: digest.recipientName,
              companyName: digest.companyName,
              overdueItems: digest.overdueItems,
              urgentItems: digest.urgentItems,
              upcomingItems: digest.upcomingItems,
              compliancePercentage: digest.compliancePercentage,
              dashboardUrl: digest.dashboardUrl,
              unsubscribeUrl: "",
            }).subject,
            summary: `${digest.overdueItems.length} overdue, ${digest.urgentItems.length} urgent, ${digest.upcomingItems.length} upcoming`,
          });
        }
      }

      const isManagementOrAdmin = member.isManagement || member.role === "admin";
      if (
        isManagementOrAdmin &&
        consent.allows(EMAIL_TYPE.weekly) &&
        !alreadySentToday.has(digestClaimKey(member.id, "weekly"))
      ) {
        const mgmt = await compileManagementDigest(db, member.id, co.id);
        if (mgmt) {
          queue.push({
            kind: "weekly",
            userId: member.id,
            email: mgmt.recipientEmail,
            companyId: co.id,
            companyName: co.name,
            subject: weeklyManagementDigestEmail({
              recipientName: mgmt.recipientName,
              companyName: mgmt.companyName,
              compliancePercentage: mgmt.compliancePercentage,
              overdueCount: mgmt.overdueCount,
              urgentCount: mgmt.urgentCount,
              escalationCount: mgmt.escalationCount,
              totalRequirements: mgmt.totalRequirements,
              completedRequirements: mgmt.completedRequirements,
              dashboardUrl: mgmt.dashboardUrl,
              unsubscribeUrl: "",
            }).subject,
            summary: `${mgmt.compliancePercentage}% compliant, ${mgmt.overdueCount} overdue, ${mgmt.escalationCount} escalations`,
          });
        }
      }
    }
  }
  return queue;
}

/** Resend's default rate limit is ~2 requests/second. */
const SEND_INTERVAL_MS = 600;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface DigestSendResult {
  skipped: string | null;
  sent: number;
  failed: number;
  optedOut: number;
  /** Claimed by an earlier press or another tab; nothing sent, nothing lost. */
  alreadySentToday: number;
  deferred: number;
}

/**
 * Send the first `limit` queued digests, in queue order. Recompiles each
 * digest immediately before sending rather than trusting the queue the
 * operator looked at, so nobody receives a digest whose numbers moved while
 * the page was open.
 */
/** The in-flight batch, or null. Same single-container assumption as the
 *  lifecycle dispatcher: two presses cannot interleave two send loops. */
let activeDigestRun: Promise<DigestSendResult> | null = null;

export async function sendDigestBatch(
  db: Database,
  limit: number,
  actorUserId: string,
): Promise<DigestSendResult> {
  if (activeDigestRun) {
    return {
      skipped: "a digest batch is already in progress",
      sent: 0,
      failed: 0,
      optedOut: 0,
      alreadySentToday: 0,
      deferred: 0,
    };
  }
  const run = executeDigestBatch(db, limit, actorUserId);
  activeDigestRun = run;
  try {
    return await run;
  } finally {
    activeDigestRun = null;
  }
}

async function executeDigestBatch(
  db: Database,
  limit: number,
  actorUserId: string,
): Promise<DigestSendResult> {
  const suppression = mailSuppressionReason();
  if (suppression) {
    return {
      skipped: `email transport unavailable (${suppression})`,
      sent: 0,
      failed: 0,
      optedOut: 0,
      alreadySentToday: 0,
      deferred: 0,
    };
  }

  const queue = await buildDigestQueue(db);
  const batch = queue.slice(0, Math.max(1, limit));
  const result: DigestSendResult = {
    skipped: null,
    sent: 0,
    failed: 0,
    optedOut: 0,
    alreadySentToday: 0,
    deferred: queue.length - batch.length,
  };

  for (const [index, item] of batch.entries()) {
    const footer = preferenceFooterFor(item.userId, EMAIL_TYPE[item.kind]);
    const content =
      item.kind === "daily"
        ? await compileDailyDigest(db, item.userId, item.companyId).then((d) =>
            d
              ? dailyDigestEmail({
                  recipientName: d.recipientName,
                  companyName: d.companyName,
                  overdueItems: d.overdueItems,
                  urgentItems: d.urgentItems,
                  upcomingItems: d.upcomingItems,
                  compliancePercentage: d.compliancePercentage,
                  dashboardUrl: d.dashboardUrl,
                  unsubscribeUrl: footer.unsubscribeUrl,
                })
              : null,
          )
        : await compileManagementDigest(db, item.userId, item.companyId).then((d) =>
            d
              ? weeklyManagementDigestEmail({
                  recipientName: d.recipientName,
                  companyName: d.companyName,
                  compliancePercentage: d.compliancePercentage,
                  overdueCount: d.overdueCount,
                  urgentCount: d.urgentCount,
                  escalationCount: d.escalationCount,
                  totalRequirements: d.totalRequirements,
                  completedRequirements: d.completedRequirements,
                  dashboardUrl: d.dashboardUrl,
                  unsubscribeUrl: footer.unsubscribeUrl,
                })
              : null,
          );

    // Emptied out between queueing and sending: nothing left to say.
    if (!content) continue;

    // Claim before sending, exactly as the lifecycle dispatcher does. The
    // partial unique index arbitrates, so a second press or a second tab
    // finds the row already there and skips rather than sending a duplicate.
    const now = new Date();
    const claimed = await db
      .insert(notification)
      .values({
        companyId: item.companyId,
        recipientId: item.userId,
        entityType: ENTITY_TYPE[item.kind],
        entityId: item.userId,
        triggerField: utcDay(now),
        subject: content.subject,
        channel: "email" as const,
        status: "sent" as const,
        scheduledFor: now,
        sentAt: now,
        urgency: "info" as const,
        escalationLevel: 0,
      })
      .onConflictDoNothing()
      .returning({ id: notification.id });
    const claim = claimed[0];
    if (!claim) {
      result.alreadySentToday++;
      continue;
    }

    const res = await sendMail({
      emailType: EMAIL_TYPE[item.kind],
      recipientUserId: item.userId,
      db,
      to: item.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (!res.success) {
      result.failed++;
      logAudit({
        companyId: item.companyId,
        userId: null,
        action: "email.digest_failed",
        entityType: "notification",
        entityId: null,
        description: `${item.kind} digest to ${item.email} failed after retries`,
      });
    } else if ("skipped" in res) {
      result.optedOut++;
    } else if (isSuppressedSendId(res.id)) {
      // Transport went away mid-batch; stop rather than report phantom sends.
      result.skipped = "email transport became unavailable during the batch";
      break;
    } else {
      result.sent++;
    }

    if (index < batch.length - 1) await wait(SEND_INTERVAL_MS);
  }

  logAudit({
    companyId: null,
    userId: actorUserId,
    action: "email.digest_batch_sent",
    entityType: "system",
    entityId: null,
    description: `Platform admin sent a digest batch (limit ${limit}): ${JSON.stringify(result)}`,
  });
  return result;
}
