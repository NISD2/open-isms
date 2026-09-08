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
 * Unlike the lifecycle campaign there is no once-ever claim: a digest is
 * meant to recur. What stops a double-send is that a person presses the
 * button, plus the empty-digest rule below — send twice in a morning and
 * the second one still has content, so the operator is the guard here.
 */
import "@/lib/server-guard";
import { eq, isNotNull } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { compileDailyDigest, compileManagementDigest } from "@/lib/compliance/digest";
import type { Database } from "@/lib/db";
import { loadEmailConsent } from "@/lib/mail/consent";
import type { UserConsentEmailTypeId } from "@/lib/mail/email-types";
import { preferenceFooterFor } from "@/lib/mail/footer";
import { isSuppressedSendId, mailSuppressionReason, sendMail } from "@/lib/mail/send";
import { dailyDigestEmail, weeklyManagementDigestEmail } from "@/lib/mail/templates";
import { company, user } from "@/schema";

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
    where: isNotNull(company.activatedAt),
    columns: { id: true, name: true },
  });

  const queue: QueuedDigest[] = [];
  for (const co of companies) {
    const members = await db.query.user.findMany({
      where: eq(user.companyId, co.id),
      columns: { id: true, email: true, isManagement: true, role: true },
    });

    for (const member of members) {
      const consent = await loadEmailConsent(db, member.id);

      if (consent.allows(EMAIL_TYPE.daily)) {
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
      if (isManagementOrAdmin && consent.allows(EMAIL_TYPE.weekly)) {
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
  deferred: number;
}

/**
 * Send the first `limit` queued digests, in queue order. Recompiles each
 * digest immediately before sending rather than trusting the queue the
 * operator looked at, so nobody receives a digest whose numbers moved while
 * the page was open.
 */
export async function sendDigestBatch(
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
