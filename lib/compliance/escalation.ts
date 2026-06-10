/**
 * Escalation Engine — Smart escalation for overdue compliance requirements
 *
 * Mirrors NIS2 Art. 38 chain of responsibility:
 *   Level 0: assignee (reminders before/at deadline)
 *   Level 1: category_lead (on due date)
 *   Level 2: admin (7d overdue)
 *   Level 3: management (14d+ overdue, mandatory items)
 *
 * Every escalation is immutable audit evidence: "person X was notified
 * about deadline Y at time Z at escalation level N."
 */
import { eq, and } from "drizzle-orm";
import {
  notification,
  companyRequirementStatus,
  companyAssessment,
  requirementCategory,
} from "@/schema";
import type { Database } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  daysUntilDeadline,
  computeUrgency,
  type Priority,
  type Importance,
  type Urgency,
} from "./deadlines";
import {
  resolveRecipients,
  resolveManagement,
  resolveCategoryLead,
  type RecipientInfo,
} from "./resolve-recipients";
import { getAppUrl } from "@/lib/utils";
import requirementsEn from "@/messages/requirements/en.json";

// ---------------------------------------------------------------------------
// Default Escalation Rules — Seeded per company
// ---------------------------------------------------------------------------

interface DefaultRule {
  level: number;
  delayDays: number;
  recipientType: "assignee" | "category_lead" | "admin" | "management";
  priority: string | null;
}

const DEFAULT_RULES: DefaultRule[] = [
  { level: 0, delayDays: -30, recipientType: "assignee", priority: null },
  { level: 0, delayDays: -7, recipientType: "assignee", priority: null },
  { level: 1, delayDays: 0, recipientType: "category_lead", priority: null },
  { level: 2, delayDays: 7, recipientType: "admin", priority: null },
  { level: 3, delayDays: 14, recipientType: "management", priority: "P0" },
  { level: 3, delayDays: 30, recipientType: "management", priority: null },
];

// ---------------------------------------------------------------------------
// Process Escalation — For a single overdue requirement
// ---------------------------------------------------------------------------

interface EscalationOpts {
  /** companyRequirementStatus.id */
  statusId: string;
  companyId: string;
}

/**
 * Process escalation for an overdue requirement.
 * Checks the company's escalation rules and creates notifications
 * for the next appropriate level if the delay threshold has passed.
 */
export async function processEscalation(
  db: Database,
  opts: EscalationOpts,
): Promise<void> {
  // 1. Load the status row with requirement + assessment context
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

  if (!statusRow?.nextReviewDate) return;

  const deadline = new Date(statusRow.nextReviewDate);
  const daysLeft = daysUntilDeadline(deadline);

  // Only escalate if overdue or at/near deadline
  if (daysLeft > 0) return;

  const daysOverdue = Math.abs(daysLeft);
  const req = statusRow.requirement;
  const priority = req.priority as Priority;
  const importance = (req.importance ?? "mandatory") as Importance;

  // 2. Use hardcoded escalation rules
  const rules = DEFAULT_RULES;

  // 3. Find the highest escalation level already reached for this requirement
  const existingNotifications = await db.query.notification.findMany({
    where: and(
      eq(notification.entityType, "requirement"),
      eq(notification.entityId, req.id),
      eq(notification.companyId, opts.companyId),
    ),
  });

  const maxLevel = existingNotifications.reduce(
    (max, n) => Math.max(max, n.escalationLevel ?? 0),
    -1,
  );

  // 4. Find applicable rules whose thresholds have been met
  const applicableRules = rules.filter((rule) => {
    // Already at or above this level
    if (rule.level <= maxLevel) return false;

    // Check delay threshold (positive = days after deadline)
    if (rule.delayDays > 0 && daysOverdue < rule.delayDays) return false;
    if (rule.delayDays === 0 && daysLeft > 0) return false;

    // Check priority filter
    if (rule.priority && rule.priority !== priority) return false;

    return true;
  });

  if (applicableRules.length === 0) return;

  // 5. Load assessment for recipient resolution
  const assessment = await db.query.companyAssessment.findFirst({
    where: eq(companyAssessment.id, statusRow.assessmentId),
    columns: { id: true },
  });
  if (!assessment) return;

  // 6. Build deep link
  const category = await db.query.requirementCategory.findFirst({
    where: eq(requirementCategory.id, req.categoryId),
    columns: { slug: true },
  });
  const linkUrl = `${getAppUrl()}/compliance/${category?.slug ?? "unknown"}#${req.code}`;

  // 7. For each applicable rule, resolve recipients and create notifications
  for (const rule of applicableRules) {
    const recipients = await resolveEscalationRecipients(db, {
      recipientType: rule.recipientType,
      assessmentId: statusRow.assessmentId,
      categoryId: req.categoryId,
      requirementId: req.id,
      companyId: opts.companyId,
    });

    if (recipients.length === 0) continue;

    const urgency: Urgency =
      rule.recipientType === "management" ? "critical" : computeUrgency(daysLeft, priority, importance);

    const subject = `Escalation Level ${rule.level}: ${req.code} is ${daysOverdue}d overdue`;

    const rows = recipients.flatMap((r) => [
      {
        companyId: opts.companyId,
        recipientId: r.userId,
        entityType: "requirement" as const,
        entityId: req.id,
        triggerField: `escalation_level_${rule.level}`,
        subject,
        body: `${req.code}: ${requirementsEn.requirements[req.code.replace(/\./g, "_") as keyof typeof requirementsEn.requirements]?.title ?? req.code} — ${daysOverdue} days overdue`,
        channel: "in_app" as const,
        status: "sent" as const,
        scheduledFor: new Date(),
        sentAt: new Date(),
        urgency,
        escalationLevel: rule.level,
        linkUrl,
      },
      {
        companyId: opts.companyId,
        recipientId: r.userId,
        entityType: "requirement" as const,
        entityId: req.id,
        triggerField: `escalation_level_${rule.level}`,
        subject,
        body: `${req.code}: ${requirementsEn.requirements[req.code.replace(/\./g, "_") as keyof typeof requirementsEn.requirements]?.title ?? req.code} — ${daysOverdue} days overdue`,
        channel: "email" as const,
        status: "pending" as const,
        scheduledFor: new Date(),
        urgency,
        escalationLevel: rule.level,
        linkUrl,
      },
    ]);

    await db.insert(notification).values(rows);

    // Audit every escalation
    logAudit({
      companyId: opts.companyId,
      userId: null,
      action: `notification.escalated_level_${rule.level}`,
      entityType: "requirement",
      entityId: req.id,
      description: `Escalated ${req.code} to level ${rule.level} (${rule.recipientType}), ${daysOverdue}d overdue, ${recipients.length} recipients`,
    });
  }
}

// ---------------------------------------------------------------------------
// Resolve Escalation Recipients
// ---------------------------------------------------------------------------

async function resolveEscalationRecipients(
  db: Database,
  opts: {
    recipientType: string;
    assessmentId: string;
    categoryId: string;
    requirementId: string;
    companyId: string;
  },
): Promise<RecipientInfo[]> {
  switch (opts.recipientType) {
    case "assignee":
      return resolveRecipients(db, {
        assessmentId: opts.assessmentId,
        categoryId: opts.categoryId,
        requirementId: opts.requirementId,
        companyId: opts.companyId,
      });

    case "category_lead":
      return resolveCategoryLead(db, {
        assessmentId: opts.assessmentId,
        categoryId: opts.categoryId,
      });

    case "admin":
    case "management":
      return resolveManagement(db, opts.companyId);

    default:
      return [];
  }
}
