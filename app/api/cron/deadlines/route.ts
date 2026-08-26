/**
 * Cron Job: Daily Deadline Heartbeat
 *
 * Single daily cron (Vercel Cron or manual trigger), 7 phases:
 *   1. Status transitions: nextReviewDate <= today → "needs_review"
 *   2. Backfill: NULL nextReviewDate → compute from priority
 *   3. Notification creation: schedule reminders for approaching deadlines
 *   4. Escalation: process overdue items through escalation chain
 *   5. Digest compilation: batch pending emails into daily/weekly digests
 *   6. Supplier portal: drain queued supplier_publication_event broadcasts
 *      (incident notifications); cron is the safety net for sync fan-out
 *      that failed in the publish path.
 *   7. GDPR retention: minimise the raw email on erasure records past their
 *      three-year window, leaving only the pseudonymous fingerprint.
 *
 * Security: Bearer token from CRON_SECRET env var.
 * Schedule: Vercel Cron at 06:00 UTC (08:00 CET)
 */
import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql, inArray, lte, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  companyRequirementStatus,
  companyAssessment,
  company,
  user,
  notification,
} from "@/schema";
import { nis2StatusScope } from "@/server/trpc/helpers/nis2-scope";
import { logAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import { verifyCronBearer } from "@/lib/cron/auth";
import { purgeExpiredErasureRecords } from "@/lib/gdpr/erase-user";
import requirementsEn from "@/messages/requirements/en.json";
import {
  computeInitialDeadline,
  computeNotificationSchedule,
  computeUrgency,
  daysUntilDeadline,
  isRecurringFrequency,
  toDateString,
  type Frequency,
  type Priority,
  type Importance,
} from "@/lib/compliance/deadlines";
import { processEscalation } from "@/lib/compliance/escalation";
import { resolveRecipients } from "@/lib/compliance/resolve-recipients";
import { compileDailyDigest, compileManagementDigest } from "@/lib/compliance/digest";
import {
  sendMail,
  deadlineReminderEmail,
  deadlineUrgentEmail,
  deadlineOverdueEmail,
  dailyDigestEmail,
  weeklyManagementDigestEmail,
} from "@/lib/mail";
import { drainQueuedBroadcasts } from "@/server/trpc/routers/supplier-portal/broadcast";
import { unsubscribeUrl as buildUnsubscribeUrl } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  // Audit EW-3 (2026-06-11): constant-time bearer comparison via
  // verifyCronBearer. Removes the per-byte timing side channel on the
  // previous string compare.
  if (!verifyCronBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const stats = {
    phase1_transitions: 0,
    phase2_backfills: 0,
    phase3_notifications: 0,
    phase4_escalations: 0,
    phase5_digests: 0,
    phase6_supplier_events: 0,
    phase6_supplier_emails: 0,
    phase7_erasure_records_minimised: 0,
  };

  try {
    // -----------------------------------------------------------------------
    // Phase 1: Status transitions — overdue completed/approved → needs_review
    // -----------------------------------------------------------------------
    const today = toDateString(new Date());

    const overdueStatuses = await db.query.companyRequirementStatus.findMany({
      where: and(
        nis2StatusScope(db),
        sql`${companyRequirementStatus.nextReviewDate} <= ${today}`,
        inArray(companyRequirementStatus.status, ["completed", "approved", "not_applicable"]),
      ),
      columns: { id: true, assessmentId: true },
    });

    for (const status of overdueStatuses) {
      await db
        .update(companyRequirementStatus)
        .set({ status: "needs_review", updatedAt: new Date() })
        .where(eq(companyRequirementStatus.id, status.id));
      stats.phase1_transitions++;
    }

    // Recalculate progress for affected assessments
    const affectedAssessments = [...new Set(overdueStatuses.map((s) => s.assessmentId))];
    for (const assessmentId of affectedAssessments) {
      await recalculateAssessmentProgress(assessmentId);
    }

    // -----------------------------------------------------------------------
    // Phase 2: Backfill — NULL nextReviewDate → compute from priority
    // -----------------------------------------------------------------------
    const missingDeadlines = await db.query.companyRequirementStatus.findMany({
      where: and(
        nis2StatusScope(db),
        isNull(companyRequirementStatus.nextReviewDate),
        inArray(companyRequirementStatus.status, ["not_started", "in_progress"]),
      ),
      columns: { id: true, assessmentId: true, requirementId: true },
      with: {
        requirement: { columns: { priority: true, frequency: true } },
      },
    });

    // Group by assessmentId for start date lookup
    const assessmentStartDates = new Map<string, Date>();
    const assessmentIdsForBackfill = [...new Set(missingDeadlines.map((s) => s.assessmentId))];

    if (assessmentIdsForBackfill.length > 0) {
      const assessments = await db.query.companyAssessment.findMany({
        where: inArray(companyAssessment.id, assessmentIdsForBackfill),
        columns: { id: true, startedAt: true },
      });
      for (const a of assessments) {
        assessmentStartDates.set(a.id, a.startedAt);
      }
    }

    for (const status of missingDeadlines) {
      const frequency = status.requirement.frequency as Frequency;
      if (!isRecurringFrequency(frequency)) continue;

      const startedAt = assessmentStartDates.get(status.assessmentId);
      if (!startedAt) continue;

      const deadline = computeInitialDeadline(startedAt, status.requirement.priority as Priority);
      await db
        .update(companyRequirementStatus)
        .set({ nextReviewDate: toDateString(deadline), updatedAt: new Date() })
        .where(eq(companyRequirementStatus.id, status.id));
      stats.phase2_backfills++;
    }

    // -----------------------------------------------------------------------
    // Phase 3: Notification creation — schedule reminders for due-soon items
    // -----------------------------------------------------------------------
    // Find items with nextReviewDate within 90 days that don't have pending notifications
    const upcomingStatuses = await db.query.companyRequirementStatus.findMany({
      where: and(
        nis2StatusScope(db),
        sql`${companyRequirementStatus.nextReviewDate} IS NOT NULL`,
        sql`${companyRequirementStatus.nextReviewDate} <= ${toDateString(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))}`,
        inArray(companyRequirementStatus.status, ["completed", "approved", "needs_review", "not_applicable"]),
      ),
      with: {
        requirement: {
          columns: {
            id: true,
            code: true,
            frequency: true,
            priority: true,
            importance: true,
            categoryId: true,
          },
          with: { category: { columns: { slug: true } } },
        },
      },
    });

    // For each, check if there are already pending notifications
    for (const status of upcomingStatuses) {
      if (!status.nextReviewDate) continue;

      // Resolve company FIRST so the dedup query can scope correctly.
      // Without companyId scoping, a single pending notification in ANY tenant
      // for this global requirement.id would suppress reminders for ALL tenants.
      const assessment = await db.query.companyAssessment.findFirst({
        where: eq(companyAssessment.id, status.assessmentId),
        columns: { id: true, companyId: true },
      });
      if (!assessment) continue;

      const existingActive = await db.query.notification.findMany({
        where: and(
          eq(notification.companyId, assessment.companyId),
          eq(notification.entityType, "requirement"),
          eq(notification.entityId, status.requirement.id),
          inArray(notification.status, ["pending", "sent"]),
        ),
        columns: { id: true },
      });

      if (existingActive.length > 0) continue; // Already has active notifications

      const req = status.requirement;
      const reqKey = req.code.replace(/\./g, "_") as keyof typeof requirementsEn.requirements;
      const reqTitle = requirementsEn.requirements[reqKey]?.title ?? req.code;
      const frequency = req.frequency as Frequency;
      const priority = req.priority as Priority;
      const importance = (req.importance ?? "mandatory") as Importance;
      const reviewDate = new Date(status.nextReviewDate);
      const slug = req.category?.slug ?? "unknown";

      const schedule = computeNotificationSchedule(reviewDate, frequency, priority, importance);
      if (schedule.length === 0) continue;

      const recipients = await resolveRecipients(db, {
        assessmentId: status.assessmentId,
        categoryId: req.categoryId,
        requirementId: req.id,
        companyId: assessment.companyId,
      });

      if (recipients.length === 0) continue;

      const linkUrl = `${env.NEXT_PUBLIC_APP_URL}/compliance/${slug}#${req.code}`;

      const rows = schedule.flatMap((entry) =>
        recipients.flatMap((recipient) => [
          {
            companyId: assessment.companyId,
            recipientId: recipient.userId,
            entityType: "requirement" as const,
            entityId: req.id,
            triggerField: entry.triggerField,
            subject: `Reminder: ${req.code} review due`,
            body: `${req.code}: ${reqTitle}`,
            channel: "in_app" as const,
            status: "pending" as const,
            scheduledFor: entry.scheduledFor,
            urgency: entry.urgency,
            escalationLevel: 0,
            linkUrl,
          },
          {
            companyId: assessment.companyId,
            recipientId: recipient.userId,
            entityType: "requirement" as const,
            entityId: req.id,
            triggerField: entry.triggerField,
            subject: `Reminder: ${req.code} review due`,
            body: `${req.code}: ${reqTitle}`,
            channel: "email" as const,
            status: "pending" as const,
            scheduledFor: entry.scheduledFor,
            urgency: entry.urgency,
            escalationLevel: 0,
            linkUrl,
          },
        ])
      );

      if (rows.length > 0) {
        await db.insert(notification).values(rows);
        stats.phase3_notifications += rows.length;
      }
    }

    // -----------------------------------------------------------------------
    // Phase 4: Escalation — process overdue items
    // -----------------------------------------------------------------------
    const overdueForEscalation = await db.query.companyRequirementStatus.findMany({
      where: and(
        nis2StatusScope(db),
        sql`${companyRequirementStatus.nextReviewDate} < ${today}`,
        inArray(companyRequirementStatus.status, ["needs_review", "completed", "approved"]),
      ),
      columns: { id: true, assessmentId: true },
    });

    for (const status of overdueForEscalation) {
      const assessment = await db.query.companyAssessment.findFirst({
        where: eq(companyAssessment.id, status.assessmentId),
        columns: { companyId: true },
      });
      if (!assessment) continue;

      await processEscalation(db, {
        statusId: status.id,
        companyId: assessment.companyId,
      });
      stats.phase4_escalations++;
    }

    // -----------------------------------------------------------------------
    // Phase 5: Dispatch due notifications + compile digests
    // -----------------------------------------------------------------------
    // Send individual notifications that are due now
    const dueNotifications = await db.query.notification.findMany({
      where: and(
        eq(notification.status, "pending"),
        eq(notification.channel, "in_app"),
        lte(notification.scheduledFor, new Date()),
      ),
    });

    for (const n of dueNotifications) {
      await db
        .update(notification)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(notification.id, n.id));
    }

    // Compile and send digests (one per company). Exclude draft shells
    // (activatedAt IS NULL, auto-provisioned at email verification): they carry
    // seeded assessment rows but no real work, and the weekly management digest
    // would otherwise mail every drive-by signup a blank-named 0% report.
    const companies = await db.query.company.findMany({
      where: isNotNull(company.activatedAt),
      columns: { id: true, name: true },
    });

    for (const co of companies) {
      const members = await db.query.user.findMany({
        where: eq(user.companyId, co.id),
        columns: {
          id: true,
          email: true,
          name: true,
          isManagement: true,
          role: true,
          emailFollowupsDisabled: true,
        },
      });

      for (const member of members) {
        // Users who opted out of follow-up emails get neither the daily nor
        // the weekly digest. Transactional emails are unaffected (they're
        // sent elsewhere and not gated by this flag).
        if (member.emailFollowupsDisabled) continue;

        const unsubUrl = buildUnsubscribeUrl(member.id);

        // Daily digest for everyone (default frequency)
        const digest = await compileDailyDigest(db, member.id, co.id);
        if (digest) {
          sendMail({
            to: digest.recipientEmail,
            unsubscribeUrl: unsubUrl,
            ...dailyDigestEmail({
              recipientName: digest.recipientName,
              companyName: digest.companyName,
              overdueItems: digest.overdueItems,
              urgentItems: digest.urgentItems,
              upcomingItems: digest.upcomingItems,
              compliancePercentage: digest.compliancePercentage,
              dashboardUrl: digest.dashboardUrl,
              unsubscribeUrl: unsubUrl,
            }),
          }).catch((err) => {
            logAudit({
              companyId: co.id,
              userId: null,
              action: "email.digest_failed",
              entityType: "notification",
              entityId: null,
              description: `Daily digest to ${digest.recipientEmail} failed: ${err instanceof Error ? err.message : "unknown"}`,
            });
          });
          stats.phase5_digests++;
        }

        // Weekly management digest on Mondays
        const isMonday = new Date().getDay() === 1;
        const isManagementOrAdmin = member.isManagement || member.role === "admin";

        if (isMonday && isManagementOrAdmin) {
          const mgmtDigest = await compileManagementDigest(db, member.id, co.id);
          if (mgmtDigest) {
            sendMail({
              to: mgmtDigest.recipientEmail,
              unsubscribeUrl: unsubUrl,
              ...weeklyManagementDigestEmail({
                recipientName: mgmtDigest.recipientName,
                companyName: mgmtDigest.companyName,
                compliancePercentage: mgmtDigest.compliancePercentage,
                overdueCount: mgmtDigest.overdueCount,
                urgentCount: mgmtDigest.urgentCount,
                escalationCount: mgmtDigest.escalationCount,
                totalRequirements: mgmtDigest.totalRequirements,
                completedRequirements: mgmtDigest.completedRequirements,
                dashboardUrl: mgmtDigest.dashboardUrl,
                unsubscribeUrl: unsubUrl,
              }),
            }).catch((err) => {
              logAudit({
                companyId: co.id,
                userId: null,
                action: "email.mgmt_digest_failed",
                entityType: "notification",
                entityId: null,
                description: `Management digest to ${mgmtDigest.recipientEmail} failed: ${err instanceof Error ? err.message : "unknown"}`,
              });
            });
            stats.phase5_digests++;
          }
        }
      }
    }

    // Mark digest email notifications as sent
    const pendingEmails = await db.query.notification.findMany({
      where: and(
        eq(notification.status, "pending"),
        eq(notification.channel, "email"),
        lte(notification.scheduledFor, new Date()),
      ),
      columns: { id: true },
    });

    if (pendingEmails.length > 0) {
      await db
        .update(notification)
        .set({ status: "sent", sentAt: new Date() })
        .where(inArray(notification.id, pendingEmails.map((n) => n.id)));
    }

    // -----------------------------------------------------------------------
    // Phase 6: Supplier portal — drain queued publication event broadcasts
    // -----------------------------------------------------------------------
    try {
      const result = await drainQueuedBroadcasts();
      stats.phase6_supplier_events = result.events;
      stats.phase6_supplier_emails = result.emails;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[cron] supplier broadcast drain failed:", err);
      // Surface failure to ops via the audit log so a silent broadcast outage
      // is detectable. Phase 6 errors do NOT abort the cron — phases 1-5 still
      // complete and report success.
      logAudit({
        companyId: null,
        userId: null,
        action: "cron.deadlines.phase6_error",
        entityType: "system",
        entityId: null,
        description: `Phase 6 supplier broadcast drain failed: ${message}`,
      });
    }

    // -----------------------------------------------------------------------
    // Phase 7: GDPR retention — minimise the raw email on erasure records past
    // their three-year retention window (Art. 5(1)(e)), leaving only the
    // pseudonymous fingerprint. Isolated: errors do NOT abort the cron.
    // -----------------------------------------------------------------------
    try {
      stats.phase7_erasure_records_minimised = await purgeExpiredErasureRecords(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[cron] erasure retention purge failed:", err);
      logAudit({
        companyId: null,
        userId: null,
        action: "cron.deadlines.phase7_error",
        entityType: "system",
        entityId: null,
        description: `Phase 7 erasure retention purge failed: ${message}`,
      });
    }

    const elapsed = Date.now() - startTime;

    logAudit({
      companyId: null,
      userId: null,
      action: "cron.deadlines",
      entityType: "system",
      entityId: null,
      description: `Cron completed in ${elapsed}ms: ${JSON.stringify(stats)}`,
    });

    return NextResponse.json({ ok: true, elapsed, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logAudit({
      companyId: null,
      userId: null,
      action: "cron.deadlines.error",
      entityType: "system",
      entityId: null,
      description: `Cron failed: ${message}`,
    });

    // Don't echo internal error details to the response — even though the
    // endpoint is CRON_SECRET-gated, leaking schema/connection-string snippets
    // is unnecessary risk. Full message stays in the audit log above.
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helper — Recalculate assessment progress
// ---------------------------------------------------------------------------

async function recalculateAssessmentProgress(assessmentId: string) {
  const allStatuses = await db.query.companyRequirementStatus.findMany({
    where: eq(companyRequirementStatus.assessmentId, assessmentId),
  });
  const completed = allStatuses.filter(
    (s) => s.status === "completed" || s.status === "approved" || s.status === "not_applicable"
  ).length;
  const total = allStatuses.length;
  const percentage = total > 0 ? ((completed / total) * 100).toFixed(2) : "0";

  await db
    .update(companyAssessment)
    .set({
      completedRequirements: completed,
      compliancePercentage: percentage,
      updatedAt: new Date(),
    })
    .where(eq(companyAssessment.id, assessmentId));
}
