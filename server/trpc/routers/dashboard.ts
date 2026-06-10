import { eq, count, and, gte, isNotNull, notInArray, inArray, sql, asc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import {
  risk,
  asset,
  incident,
  supplier,
  policy,
  trainingRecord,
  exercise,
  managementReview,
  kpiMeasurement,
  changeRequest,
  patchRecord,
  internalAudit,
  improvementItem,
  companyAssessment,
  companyRequirementStatus,
  requirement,
  requirementCategory,
  bsiRegistration,
  bsiIncidentReport,
} from "@/schema";
import {
  daysUntilDeadline,
  computeUrgency,
  PRIORITIES,
  IMPORTANCES,
  type Priority,
  type Importance,
} from "@/lib/compliance/deadlines";
import requirementsEn from "@/messages/requirements/en.json";

export const dashboardRouter = router({
  summary: companyProcedure.query(async ({ ctx }) => {
    const cid = ctx.companyId;

    const [
      risksAll,
      risksHigh,
      risksByTreatment,
      assetsTotal,
      assetsCritical,
      assetsOT,
      incidentsAll,
      incidentsBySeverity,
      suppliersAll,
      suppliersByRisk,
      policiesAll,
      policiesByStatus,
      trainingAll,
      trainingMgmt,
      exercisesAll,
      exercisesCompleted,
      kpisAll,
      changesAll,
      changesOpen,
      patchesAll,
      patchesPending,
      auditsAll,
      auditsPlanned,
      improvementsAll,
      improvementsOpen,
    ] = await Promise.all([
      ctx.db.select({ count: count() }).from(risk).where(eq(risk.companyId, cid)),
      ctx.db.select({ count: count() }).from(risk).where(and(eq(risk.companyId, cid), gte(risk.riskScore, 15))),
      ctx.db.select({ treatment: risk.treatment, count: count() }).from(risk).where(eq(risk.companyId, cid)).groupBy(risk.treatment),
      ctx.db.select({ count: count() }).from(asset).where(eq(asset.companyId, cid)),
      ctx.db.select({ count: count() }).from(asset).where(and(eq(asset.companyId, cid), eq(asset.isCritical, true))),
      ctx.db.select({ count: count() }).from(asset).where(and(eq(asset.companyId, cid), eq(asset.isOT, true))),
      ctx.db.select({ count: count() }).from(incident).where(eq(incident.companyId, cid)),
      ctx.db.select({ severity: incident.severity, count: count() }).from(incident).where(eq(incident.companyId, cid)).groupBy(incident.severity),
      ctx.db.select({ count: count() }).from(supplier).where(eq(supplier.customerCompanyId, cid)),
      ctx.db.select({ riskLevel: supplier.riskLevel, count: count() }).from(supplier).where(eq(supplier.customerCompanyId, cid)).groupBy(supplier.riskLevel),
      ctx.db.select({ count: count() }).from(policy).where(eq(policy.companyId, cid)),
      ctx.db.select({ status: policy.status, count: count() }).from(policy).where(eq(policy.companyId, cid)).groupBy(policy.status),
      ctx.db.select({ count: count() }).from(trainingRecord).where(eq(trainingRecord.companyId, cid)),
      ctx.db.select({ count: count() }).from(trainingRecord).where(and(eq(trainingRecord.companyId, cid), eq(trainingRecord.isManagement, true))),
      ctx.db.select({ count: count() }).from(exercise).where(eq(exercise.companyId, cid)),
      ctx.db.select({ count: count() }).from(exercise).where(and(eq(exercise.companyId, cid), isNotNull(exercise.completedAt))),
      ctx.db.select({ count: count() }).from(kpiMeasurement).where(eq(kpiMeasurement.companyId, cid)),
      ctx.db.select({ count: count() }).from(changeRequest).where(eq(changeRequest.companyId, cid)),
      ctx.db.select({ count: count() }).from(changeRequest).where(and(eq(changeRequest.companyId, cid), notInArray(changeRequest.status, ['closed', 'rolled_back']))),
      ctx.db.select({ count: count() }).from(patchRecord).where(eq(patchRecord.companyId, cid)),
      ctx.db.select({ count: count() }).from(patchRecord).where(and(eq(patchRecord.companyId, cid), eq(patchRecord.status, "pending"))),
      ctx.db.select({ count: count() }).from(internalAudit).where(eq(internalAudit.companyId, cid)),
      ctx.db.select({ count: count() }).from(internalAudit).where(and(eq(internalAudit.companyId, cid), eq(internalAudit.status, "planned"))),
      ctx.db.select({ count: count() }).from(improvementItem).where(eq(improvementItem.companyId, cid)),
      ctx.db.select({ count: count() }).from(improvementItem).where(and(eq(improvementItem.companyId, cid), eq(improvementItem.status, "open"))),
    ]);

    const toMap = <T extends { count: number }>(rows: (T & { [k: string]: unknown })[], key: string) => {
      const map: Record<string, number> = {};
      for (const r of rows) {
        const k = String(r[key] ?? "unknown");
        map[k] = r.count;
      }
      return map;
    };

    return {
      risks: {
        total: risksAll[0]?.count ?? 0,
        high: risksHigh[0]?.count ?? 0,
        byTreatment: toMap(risksByTreatment, "treatment"),
      },
      assets: {
        total: assetsTotal[0]?.count ?? 0,
        critical: assetsCritical[0]?.count ?? 0,
        ot: assetsOT[0]?.count ?? 0,
      },
      incidents: {
        total: incidentsAll[0]?.count ?? 0,
        bySeverity: toMap(incidentsBySeverity, "severity"),
      },
      suppliers: {
        total: suppliersAll[0]?.count ?? 0,
        byRiskLevel: toMap(suppliersByRisk, "riskLevel"),
      },
      policies: {
        total: policiesAll[0]?.count ?? 0,
        byStatus: toMap(policiesByStatus, "status"),
      },
      training: {
        total: trainingAll[0]?.count ?? 0,
        management: trainingMgmt[0]?.count ?? 0,
      },
      exercises: {
        total: exercisesAll[0]?.count ?? 0,
        completed: exercisesCompleted[0]?.count ?? 0,
      },
      kpis: { total: kpisAll[0]?.count ?? 0 },
      changes: {
        total: changesAll[0]?.count ?? 0,
        open: changesOpen[0]?.count ?? 0,
      },
      patches: {
        total: patchesAll[0]?.count ?? 0,
        pending: patchesPending[0]?.count ?? 0,
      },
      audits: {
        total: auditsAll[0]?.count ?? 0,
        planned: auditsPlanned[0]?.count ?? 0,
      },
      improvements: {
        total: improvementsAll[0]?.count ?? 0,
        open: improvementsOpen[0]?.count ?? 0,
      },
    };
  }),

  /** Simple per-table counts keyed by DB table name (matches requirement.moduleRef). */
  operationalCounts: companyProcedure.query(async ({ ctx }) => {
    const cid = ctx.companyId;

    const rows = await ctx.db.execute<{ name: string; cnt: number }>(sql`
      SELECT 'asset'::text AS name, count(*)::int AS cnt FROM ${asset} WHERE ${asset.companyId} = ${cid}
      UNION ALL SELECT 'risk', count(*)::int FROM ${risk} WHERE ${risk.companyId} = ${cid}
      UNION ALL SELECT 'incident', count(*)::int FROM ${incident} WHERE ${incident.companyId} = ${cid}
      UNION ALL SELECT 'supplier', count(*)::int FROM ${supplier} WHERE ${supplier.customerCompanyId} = ${cid}
      UNION ALL SELECT 'policy', count(*)::int FROM ${policy} WHERE ${policy.companyId} = ${cid}
      UNION ALL SELECT 'training_record', count(*)::int FROM ${trainingRecord} WHERE ${trainingRecord.companyId} = ${cid}
      UNION ALL SELECT 'exercise', count(*)::int FROM ${exercise} WHERE ${exercise.companyId} = ${cid}
      UNION ALL SELECT 'management_review', count(*)::int FROM ${managementReview} WHERE ${managementReview.companyId} = ${cid}
      UNION ALL SELECT 'kpi_measurement', count(*)::int FROM ${kpiMeasurement} WHERE ${kpiMeasurement.companyId} = ${cid}
      UNION ALL SELECT 'change_request', count(*)::int FROM ${changeRequest} WHERE ${changeRequest.companyId} = ${cid}
      UNION ALL SELECT 'patch_record', count(*)::int FROM ${patchRecord} WHERE ${patchRecord.companyId} = ${cid}
      UNION ALL SELECT 'internal_audit', count(*)::int FROM ${internalAudit} WHERE ${internalAudit.companyId} = ${cid}
      UNION ALL SELECT 'improvement_item', count(*)::int FROM ${improvementItem} WHERE ${improvementItem.companyId} = ${cid}
      UNION ALL SELECT 'bsi_registration', count(*)::int FROM ${bsiRegistration} WHERE ${bsiRegistration.companyId} = ${cid}
      UNION ALL SELECT 'bsi_incident_report', count(DISTINCT ${bsiIncidentReport.id})::int FROM ${bsiIncidentReport} JOIN ${incident} ON ${bsiIncidentReport.incidentId} = ${incident.id} WHERE ${incident.companyId} = ${cid}
    `);

    const result: Record<string, number> = {};
    for (const row of rows.rows) {
      result[row.name] = row.cnt;
    }
    return result;
  }),

  complianceProgress: companyProcedure.query(async ({ ctx }) => {
    const assessments = await ctx.db
      .select({ id: companyAssessment.id })
      .from(companyAssessment)
      .where(eq(companyAssessment.companyId, ctx.companyId));

    const assessmentIds = assessments.map((a) => a.id);
    if (assessmentIds.length === 0) return { completed: 0, total: 0 };

    const [completedRows, totalRows] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(companyRequirementStatus)
        .where(
          and(
            inArray(companyRequirementStatus.assessmentId, assessmentIds),
            inArray(companyRequirementStatus.status, [
              "approved",
              "completed",
              "not_applicable",
            ]),
          ),
        ),
      ctx.db
        .select({ count: count() })
        .from(companyRequirementStatus)
        .where(inArray(companyRequirementStatus.assessmentId, assessmentIds)),
    ]);

    return {
      completed: completedRows[0]?.count ?? 0,
      total: totalRows[0]?.count ?? 0,
    };
  }),

  deadlines: companyProcedure.query(async ({ ctx }) => {
    // Get all assessments for this company
    const assessments = await ctx.db
      .select({ id: companyAssessment.id })
      .from(companyAssessment)
      .where(eq(companyAssessment.companyId, ctx.companyId));

    const assessmentIds = assessments.map((a) => a.id);
    if (assessmentIds.length === 0) return null;

    // Get all status rows with nextReviewDate, joined with requirement and category
    const statuses = await ctx.db
      .select({
        nextReviewDate: companyRequirementStatus.nextReviewDate,
        status: companyRequirementStatus.status,
        requirementCode: requirement.code,
        priority: requirement.priority,
        importance: requirement.importance,
        categorySlug: requirementCategory.slug,
      })
      .from(companyRequirementStatus)
      .innerJoin(
        requirement,
        eq(companyRequirementStatus.requirementId, requirement.id),
      )
      .innerJoin(
        requirementCategory,
        eq(requirement.categoryId, requirementCategory.id),
      )
      .where(
        and(
          inArray(companyRequirementStatus.assessmentId, assessmentIds),
          isNotNull(companyRequirementStatus.nextReviewDate),
          inArray(companyRequirementStatus.status, [
            "completed",
            "approved",
            "needs_review",
          ]),
        ),
      );

    // Compute counts and top 10 upcoming
    const now = new Date();
    let overdueCount = 0;
    let dueThisWeekCount = 0;
    let dueThisMonthCount = 0;

    interface DeadlineItem {
      requirementCode: string;
      requirementTitle: string;
      priority: string;
      deadline: string;
      daysRemaining: number;
      categorySlug: string;
      urgency: "info" | "warning" | "urgent" | "critical";
    }

    const upcoming: DeadlineItem[] = [];

    for (const row of statuses) {
      if (!row.nextReviewDate) continue;

      const deadline = new Date(row.nextReviewDate);
      const days = daysUntilDeadline(deadline, now);
      const priority = PRIORITIES.includes(row.priority as Priority) ? row.priority as Priority : "P3";
      const importance = IMPORTANCES.includes((row.importance ?? "mandatory") as Importance)
        ? (row.importance ?? "mandatory") as Importance
        : "mandatory";
      const urgency = computeUrgency(days, priority, importance);

      if (days < 0) overdueCount++;
      if (days >= 0 && days <= 7) dueThisWeekCount++;
      if (days >= 0 && days <= 30) dueThisMonthCount++;

      const reqKey = row.requirementCode.replace(/\./g, "_") as keyof typeof requirementsEn.requirements;
      upcoming.push({
        requirementCode: row.requirementCode,
        requirementTitle: requirementsEn.requirements[reqKey]?.title ?? row.requirementCode,
        priority: row.priority,
        deadline: row.nextReviewDate,
        daysRemaining: days,
        categorySlug: row.categorySlug,
        urgency,
      });
    }

    // Sort by daysRemaining ascending, take top 10
    upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
    const top10 = upcoming.slice(0, 10);

    return {
      overdueCount,
      dueThisWeekCount,
      dueThisMonthCount,
      upcoming: top10,
    };
  }),
});
