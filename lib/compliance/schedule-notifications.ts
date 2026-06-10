/**
 * Notification Scheduling Engine — Core orchestrator for deadline reminders
 *
 * Called after:
 *   1. A requirement is completed (updateRequirementStatus)
 *   2. A submission is approved (review.approve)
 *   3. An assessment is created (createCompanyAndAssessment)
 *
 * Responsibilities:
 *   - Compute nextReviewDate and persist it on the status row
 *   - Cancel stale pending notifications (idempotent rescheduling)
 *   - Resolve recipients via assignment cascade
 *   - Create dual-channel notification rows (in-app + email)
 *   - Set urgency, escalation level, and deep links
 */
import { eq, and, inArray } from "drizzle-orm";
import {
  notification,
  companyRequirementStatus,
  requirement,
  requirementCategory,
  companyAssessment,
} from "@/schema";
import type { Database } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  computeNextReviewDate,
  computeInitialDeadline,
  computeNotificationSchedule,
  computeUrgency,
  daysUntilDeadline,
  isRecurringFrequency,
  toDateString,
  type Frequency,
  type Priority,
  type Importance,
  type Urgency,
} from "./deadlines";
import { resolveRecipients, type RecipientInfo } from "./resolve-recipients";
import { getAppUrl } from "@/lib/utils";
import requirementsEn from "@/messages/requirements/en.json";

function getReqTitle(code: string): string {
  const key = code.replace(/\./g, "_") as keyof typeof requirementsEn.requirements;
  return requirementsEn.requirements[key]?.title ?? code;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduleOpts {
  /** The companyRequirementStatus.id */
  statusId: string;
  /** Anchor date — when the requirement was completed or approved */
  anchorDate: Date;
  /** The company that owns this assessment */
  companyId: string;
  /** Who triggered this action (for audit) */
  userId: string | null;
}

interface BulkScheduleOpts {
  /** Assessment ID to backfill deadlines for */
  assessmentId: string;
  companyId: string;
  userId: string | null;
}

// ---------------------------------------------------------------------------
// Main Entry Point — Schedule reminders for a single requirement
// ---------------------------------------------------------------------------

/**
 * After a requirement is completed/approved, compute the next review date
 * and schedule reminder notifications for all assigned recipients.
 */
export async function scheduleDeadlineReminders(
  db: Database,
  opts: ScheduleOpts,
): Promise<void> {
  // 1. Load the status row with requirement context
  const statusRow = await db.query.companyRequirementStatus.findFirst({
    where: eq(companyRequirementStatus.id, opts.statusId),
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
      },
    },
  });

  if (!statusRow) return;

  const req = statusRow.requirement;
  const frequency = req.frequency as Frequency;
  const priority = req.priority as Priority;
  const importance = (req.importance ?? "mandatory") as Importance;

  // 2. Compute next review date
  if (!isRecurringFrequency(frequency)) {
    // Non-recurring: clear nextReviewDate (no future review needed) and update lastReviewedAt
    await db
      .update(companyRequirementStatus)
      .set({
        nextReviewDate: null,
        lastReviewedAt: opts.anchorDate,
        updatedAt: new Date(),
      })
      .where(eq(companyRequirementStatus.id, opts.statusId));
    return;
  }

  const nextReview = computeNextReviewDate(opts.anchorDate, frequency);
  if (!nextReview) return;

  // 3. Persist nextReviewDate and lastReviewedAt
  await db
    .update(companyRequirementStatus)
    .set({
      nextReviewDate: toDateString(nextReview),
      lastReviewedAt: opts.anchorDate,
      updatedAt: new Date(),
    })
    .where(eq(companyRequirementStatus.id, opts.statusId));

  // 4. Cancel existing pending notifications for this requirement (idempotent)
  // SCOPED to opts.companyId — without scope, cancelling tenant A would also
  // cancel tenant B's pending notifications because requirement.id is global.
  await cancelPendingNotifications(
    db,
    opts.companyId,
    "requirement",
    statusRow.requirementId,
  );

  // 5. Resolve recipients
  const recipients = await resolveRecipients(db, {
    assessmentId: statusRow.assessmentId,
    categoryId: req.categoryId,
    requirementId: req.id,
    companyId: opts.companyId,
  });

  if (recipients.length === 0) {
    logAudit({
      companyId: opts.companyId,
      userId: opts.userId,
      action: "notification.no_recipients",
      entityType: "requirement",
      entityId: statusRow.requirementId,
      description: `No recipients found for ${req.code} — no assignments and no admins`,
    });
    return;
  }

  // 6. Build deep link URL
  const linkUrl = await buildRequirementLink(db, req.categoryId, req.code);

  // 7. Compute notification schedule
  const schedule = computeNotificationSchedule(
    nextReview,
    frequency,
    priority,
    importance,
  );

  // 8. Create dual-channel notification rows (in-app + email)
  const notificationRows = schedule.flatMap((entry) =>
    recipients.flatMap((recipient) =>
      createDualChannelRows({
        companyId: opts.companyId,
        recipientId: recipient.userId,
        requirementId: statusRow.requirementId,
        requirementCode: req.code,
        requirementTitle: getReqTitle(req.code),
        scheduledFor: entry.scheduledFor,
        triggerField: entry.triggerField,
        urgency: entry.urgency,
        linkUrl,
        escalationLevel: 0,
      })
    )
  );

  if (notificationRows.length > 0) {
    await db.insert(notification).values(notificationRows);
  }

  // 9. Audit log
  logAudit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: "notification.scheduled",
    entityType: "requirement",
    entityId: statusRow.requirementId,
    description: `Scheduled ${notificationRows.length} deadline reminders for ${req.code} (next review: ${toDateString(nextReview)})`,
  });
}

// ---------------------------------------------------------------------------
// Bulk Initial Deadlines — Called when creating a new assessment
// ---------------------------------------------------------------------------

/**
 * Bulk-set initial nextReviewDate on all status rows for a new assessment,
 * computed from priority and the assessment start date.
 */
export async function backfillInitialDeadlines(
  db: Database,
  opts: BulkScheduleOpts,
): Promise<void> {
  // Load assessment start date
  const assessment = await db.query.companyAssessment.findFirst({
    where: eq(companyAssessment.id, opts.assessmentId),
    columns: { startedAt: true },
  });

  if (!assessment) return;

  // Load all status rows for this assessment with requirement context
  const statuses = await db.query.companyRequirementStatus.findMany({
    where: eq(companyRequirementStatus.assessmentId, opts.assessmentId),
    columns: { id: true, requirementId: true, nextReviewDate: true },
    with: {
      requirement: {
        columns: { priority: true, frequency: true },
      },
    },
  });

  // Only backfill rows that don't already have a nextReviewDate
  const toUpdate = statuses.filter((s) => !s.nextReviewDate);

  for (const status of toUpdate) {
    const frequency = status.requirement.frequency as Frequency;
    const priority = status.requirement.priority as Priority;

    // For recurring requirements, set initial deadline from priority
    // For non-recurring, skip
    if (!isRecurringFrequency(frequency)) continue;

    const deadline = computeInitialDeadline(assessment.startedAt, priority);

    await db
      .update(companyRequirementStatus)
      .set({
        nextReviewDate: toDateString(deadline),
        updatedAt: new Date(),
      })
      .where(eq(companyRequirementStatus.id, status.id));
  }

  logAudit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: "notification.deadlines_backfilled",
    entityType: "assessment",
    entityId: opts.assessmentId,
    description: `Backfilled initial deadlines for ${toUpdate.length} requirements`,
  });
}

// ---------------------------------------------------------------------------
// Cancel Pending — Idempotent cleanup before rescheduling
// ---------------------------------------------------------------------------

/**
 * Cancel all pending/sent notifications for a given entity, scoped to a single
 * company. Sets status to "cancelled" (not deleted, for audit trail).
 *
 * The companyId scope is REQUIRED — without it, completing a global-id entity
 * (e.g. a NIS2 requirement.id which is shared across tenants) in tenant A
 * would silently cancel pending reminders in tenant B.
 */
export async function cancelPendingNotifications(
  db: Database,
  companyId: string,
  entityType: string,
  entityId: string,
): Promise<number> {
  const result = await db
    .update(notification)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(notification.companyId, companyId),
        eq(notification.entityType, entityType),
        eq(notification.entityId, entityId),
        inArray(notification.status, ["pending", "sent"]),
      )
    );

  return result.rowCount ?? 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface NotificationRowInput {
  companyId: string;
  recipientId: string;
  requirementId: string;
  requirementCode: string;
  requirementTitle: string;
  scheduledFor: Date;
  triggerField: string;
  urgency: Urgency;
  linkUrl: string;
  escalationLevel: number;
}

/**
 * Create dual-channel notification rows: one in-app (immediately "sent")
 * and one email ("pending" for cron to pick up or immediate send).
 */
function createDualChannelRows(input: NotificationRowInput) {
  const subject = buildSubject(input.requirementCode, input.triggerField, input.urgency);
  const body = `${input.requirementCode}: ${input.requirementTitle}`;

  return [
    // In-app — immediately visible
    {
      companyId: input.companyId,
      recipientId: input.recipientId,
      entityType: "requirement" as const,
      entityId: input.requirementId,
      triggerField: input.triggerField,
      subject,
      body,
      channel: "in_app" as const,
      status: "pending" as const,
      scheduledFor: input.scheduledFor,
      urgency: input.urgency,
      escalationLevel: input.escalationLevel,
      linkUrl: input.linkUrl,
    },
    // Email — queued for cron dispatch or immediate send
    {
      companyId: input.companyId,
      recipientId: input.recipientId,
      entityType: "requirement" as const,
      entityId: input.requirementId,
      triggerField: input.triggerField,
      subject,
      body,
      channel: "email" as const,
      status: "pending" as const,
      scheduledFor: input.scheduledFor,
      urgency: input.urgency,
      escalationLevel: input.escalationLevel,
      linkUrl: input.linkUrl,
    },
  ];
}

function buildSubject(code: string, triggerField: string, urgency: Urgency): string {
  switch (urgency) {
    case "critical":
      return `OVERDUE: ${code} is past its compliance deadline`;
    case "urgent":
      return `URGENT: ${code} review deadline is approaching`;
    case "warning":
      return `Reminder: ${code} is due for review soon`;
    case "info":
      return `Upcoming: ${code} review scheduled`;
  }
}

async function buildRequirementLink(
  db: Database,
  categoryId: string,
  requirementCode: string,
): Promise<string> {
  const category = await db.query.requirementCategory.findFirst({
    where: eq(requirementCategory.id, categoryId),
    columns: { slug: true },
  });

  const slug = category?.slug ?? "unknown";
  return `${getAppUrl()}/compliance/${slug}#${requirementCode}`;
}
