/**
 * Digest Compilation — Aggregates deadline notifications into daily/weekly digests
 *
 * Used by the cron job to batch pending email notifications into a single
 * digest email instead of individual emails per reminder.
 */
import { eq, and, lte, inArray, sql, desc } from "drizzle-orm";
import {
  notification,
  companyRequirementStatus,
  companyAssessment,
  requirement,
  requirementCategory,
  company,
  user,
} from "@/schema";
import type { Database } from "@/lib/db";
import type { DigestItem } from "@/lib/mail";
import { daysUntilDeadline } from "./deadlines";
import { getAppUrl } from "@/lib/utils";
import { getNis2FrameworkId } from "@/server/trpc/helpers/nis2-scope";
import requirementsEn from "@/messages/requirements/en.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DigestData {
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  companyName: string;
  companyId: string;
  overdueItems: DigestItem[];
  urgentItems: DigestItem[];
  upcomingItems: DigestItem[];
  compliancePercentage: string;
  dashboardUrl: string;
}

export interface ManagementDigestData {
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  companyName: string;
  companyId: string;
  compliancePercentage: string;
  overdueCount: number;
  urgentCount: number;
  escalationCount: number;
  totalRequirements: number;
  completedRequirements: number;
  dashboardUrl: string;
}

// ---------------------------------------------------------------------------
// Compile Daily Digest — Per user, per company
// ---------------------------------------------------------------------------

/**
 * Compile a daily digest for a specific user by collecting all their
 * pending/upcoming deadline notifications.
 */
export async function compileDailyDigest(
  db: Database,
  recipientId: string,
  companyId: string,
): Promise<DigestData | null> {
  // Fetch user + company info
  const [recipient, companyRow] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, recipientId),
      columns: { id: true, name: true, email: true },
    }),
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: { name: true },
    }),
  ]);

  if (!recipient || !companyRow) return null;

  // NIS 2 only. Summing totalRequirements across every assessment made the
  // headline percentage in this email a fraction over 101 or 103 requirements
  // instead of 49, and put DSGVO / AI-Act / CRA requirement codes in the item
  // list of a digest the reader treats as their NIS 2 status.
  const nis2FrameworkId = await getNis2FrameworkId(db);
  if (!nis2FrameworkId) return null;

  const assessments = await db.query.companyAssessment.findMany({
    where: and(
      eq(companyAssessment.companyId, companyId),
      eq(companyAssessment.frameworkId, nis2FrameworkId),
    ),
    columns: { id: true, compliancePercentage: true, completedRequirements: true, totalRequirements: true },
  });

  if (assessments.length === 0) return null;

  // Compute aggregate compliance %
  const totalReq = assessments.reduce((s, a) => s + (a.totalRequirements ?? 0), 0);
  const completedReq = assessments.reduce((s, a) => s + (a.completedRequirements ?? 0), 0);
  const pct = totalReq > 0 ? ((completedReq / totalReq) * 100).toFixed(1) : "0";

  const assessmentIds = assessments.map((a) => a.id);

  // Find all statuses with upcoming or overdue nextReviewDate
  const statuses = await db.query.companyRequirementStatus.findMany({
    where: and(
      inArray(companyRequirementStatus.assessmentId, assessmentIds),
      sql`${companyRequirementStatus.nextReviewDate} IS NOT NULL`,
      inArray(companyRequirementStatus.status, ["completed", "approved", "needs_review"]),
    ),
    with: {
      requirement: {
        columns: { code: true, categoryId: true },
        with: {
          category: { columns: { slug: true } },
        },
      },
    },
  });

  const appUrl = getAppUrl();
  const overdueItems: DigestItem[] = [];
  const urgentItems: DigestItem[] = [];
  const upcomingItems: DigestItem[] = [];

  for (const s of statuses) {
    if (!s.nextReviewDate) continue;
    const deadline = new Date(s.nextReviewDate);
    const days = daysUntilDeadline(deadline);
    const slug = s.requirement.category?.slug ?? "unknown";

    const item: DigestItem = {
      requirementCode: s.requirement.code,
      requirementTitle: requirementsEn.requirements[s.requirement.code.replace(/\./g, "_") as keyof typeof requirementsEn.requirements]?.title ?? s.requirement.code,
      deadline: s.nextReviewDate,
      daysRemaining: days,
      urgency: days < 0 ? "critical" : days <= 7 ? "urgent" : days <= 30 ? "warning" : "info",
      categoryUrl: `${appUrl}/compliance/${slug}#${s.requirement.code}`,
    };

    if (days < 0) {
      overdueItems.push(item);
    } else if (days <= 7) {
      urgentItems.push(item);
    } else if (days <= 60) {
      upcomingItems.push(item);
    }
  }

  // Don't send empty digests
  if (overdueItems.length === 0 && urgentItems.length === 0 && upcomingItems.length === 0) {
    return null;
  }

  // Sort: most urgent first
  overdueItems.sort((a, b) => a.daysRemaining - b.daysRemaining);
  urgentItems.sort((a, b) => a.daysRemaining - b.daysRemaining);
  upcomingItems.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    companyName: companyRow.name,
    companyId,
    overdueItems,
    urgentItems,
    upcomingItems,
    compliancePercentage: pct,
    dashboardUrl: `${appUrl}/`,
  };
}

// ---------------------------------------------------------------------------
// Compile Management Digest — Executive summary
// ---------------------------------------------------------------------------

/**
 * Compile a weekly management digest with compliance overview,
 * risk exposure, and escalation counts.
 */
export async function compileManagementDigest(
  db: Database,
  recipientId: string,
  companyId: string,
): Promise<ManagementDigestData | null> {
  const [recipient, companyRow] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, recipientId),
      columns: { id: true, name: true, email: true },
    }),
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: { name: true },
    }),
  ]);

  if (!recipient || !companyRow) return null;

  // NIS 2 only, same reason as compileDailyDigest above. This one is the
  // management digest, which the reader may file as Art. 20 / section 38 evidence.
  const nis2FrameworkId = await getNis2FrameworkId(db);
  if (!nis2FrameworkId) return null;

  const assessments = await db.query.companyAssessment.findMany({
    where: and(
      eq(companyAssessment.companyId, companyId),
      eq(companyAssessment.frameworkId, nis2FrameworkId),
    ),
    columns: { id: true, compliancePercentage: true, completedRequirements: true, totalRequirements: true },
  });

  const totalReq = assessments.reduce((s, a) => s + (a.totalRequirements ?? 0), 0);
  const completedReq = assessments.reduce((s, a) => s + (a.completedRequirements ?? 0), 0);
  const pct = totalReq > 0 ? ((completedReq / totalReq) * 100).toFixed(1) : "0";

  const assessmentIds = assessments.map((a) => a.id);

  // Count overdue
  let overdueCount = 0;
  let urgentCount = 0;

  if (assessmentIds.length > 0) {
    const statuses = await db.query.companyRequirementStatus.findMany({
      where: and(
        inArray(companyRequirementStatus.assessmentId, assessmentIds),
        sql`${companyRequirementStatus.nextReviewDate} IS NOT NULL`,
      ),
      columns: { nextReviewDate: true },
    });

    for (const s of statuses) {
      if (!s.nextReviewDate) continue;
      const days = daysUntilDeadline(new Date(s.nextReviewDate));
      if (days < 0) overdueCount++;
      else if (days <= 7) urgentCount++;
    }
  }

  // Count escalations (level >= 2)
  const escalationRows = await db.query.notification.findMany({
    where: and(
      eq(notification.companyId, companyId),
      sql`${notification.escalationLevel} >= 2`,
      sql`${notification.createdAt} > NOW() - INTERVAL '7 days'`,
    ),
    columns: { id: true },
  });

  return {
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    companyName: companyRow.name,
    companyId,
    compliancePercentage: pct,
    overdueCount,
    urgentCount,
    escalationCount: escalationRows.length,
    totalRequirements: totalReq,
    completedRequirements: completedReq,
    dashboardUrl: `${getAppUrl()}/`,
  };
}
