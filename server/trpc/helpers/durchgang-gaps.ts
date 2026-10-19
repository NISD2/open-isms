import { and, count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { isBackupSystem } from "@/lib/asset-inventory/catalog-labels";
import type { DbOrTx } from "@/lib/db";
import {
  asksSecondFactor,
  type GapFacts,
  MANAGEMENT_ROLE,
  NIS2_WALK,
} from "@/lib/durchgang";
import {
  asset,
  companyCategoryIntake,
  companyMembership,
  improvementItem,
  requirement,
  requirementCategory,
  supplier,
  trainingRecord,
  user,
} from "@/schema";
import { walkStates } from "./durchgang";
import { getNis2Assessment } from "./nis2-scope";

/**
 * The open points the NIS 2 approval lists (`gapsOf`) and who takes care of each: read off the
 * company's NIS 2 records, so they are the NIS 2 walk's.
 */

/** 3.3's answer as the intake stores it; anything else reads as unanswered. */
const REPORTING = z.object({ bsiReportingRegistered: z.boolean().optional() }).catch({});

/**
 * The facts `gapsOf` reads, for one company: its programs with a sign-in, suppliers, backup
 * systems, 3.3's answer, who holds the management role and the management trainings, and the
 * steps set aside. Every query is filtered by the company.
 */
export async function gapFactsOf(
  db: DbOrTx,
  companyId: string,
  today: Date,
): Promise<GapFacts> {
  const [assets, suppliers, managers, trainings, assessment, states] = await Promise.all([
    db
      .select({
        name: asset.name,
        type: asset.type,
        catalogId: asset.catalogId,
        description: asset.description,
        hasMfa: asset.hasMfa,
        lastRestore: asset.lastBackupTestDate,
      })
      .from(asset)
      .where(eq(asset.companyId, companyId)),
    db
      .select({
        name: supplier.name,
        riskLevel: supplier.riskLevel,
        security: supplier.hasSecurityClauses,
        incidents: supplier.hasIncidentNotificationClause,
      })
      .from(supplier)
      .where(eq(supplier.customerCompanyId, companyId)),
    db
      .select({ n: count() })
      .from(companyMembership)
      .where(
        and(
          eq(companyMembership.companyId, companyId),
          eq(companyMembership.jobTitle, MANAGEMENT_ROLE),
        ),
      ),
    db
      .select({
        name: trainingRecord.participantName,
        completedAt: trainingRecord.completedAt,
      })
      .from(trainingRecord)
      .where(
        and(
          eq(trainingRecord.companyId, companyId),
          eq(trainingRecord.isManagement, true),
        ),
      ),
    getNis2Assessment(db, companyId),
    walkStates(db, companyId, NIS2_WALK),
  ]);
  const [intake] = assessment
    ? await db
        .select({ answers: companyCategoryIntake.answers })
        .from(companyCategoryIntake)
        .innerJoin(
          requirementCategory,
          eq(requirementCategory.id, companyCategoryIntake.categoryId),
        )
        .where(
          and(
            eq(companyCategoryIntake.assessmentId, assessment.id),
            eq(requirementCategory.code, "INC"),
          ),
        )
    : [];
  return {
    signIns: assets
      .filter(asksSecondFactor)
      .map((a) => ({ name: a.name, hasMfa: a.hasMfa === true })),
    suppliers: suppliers.map((s) => ({
      name: s.name,
      riskLevel: s.riskLevel,
      security: s.security === true,
      incidents: s.incidents === true,
    })),
    backups: assets
      .filter(isBackupSystem)
      .map((a) => ({ name: a.name, lastRestore: a.lastRestore })),
    reporting: REPORTING.parse(intake?.answers ?? {}).bsiReportingRegistered ?? null,
    managers: managers[0]?.n ?? 0,
    managementTrainings: trainings,
    setAside: states.filter((s) => s.state.kind === "waiting").map((s) => s.code),
    today,
  };
}

/**
 * Where an open point of the approval goes once someone takes it on: a line on the improvement
 * register (7.4), whose source says it came from the company's own answers and whose reference is
 * the step's requirement. A line counts while nobody has closed it.
 */
export const MEASURE_SOURCE =
  "gap_analysis" satisfies typeof improvementItem.$inferSelect.source;
const STILL_OPEN = [
  "open",
  "in_progress",
  "deferred",
] as const satisfies readonly (typeof improvementItem.$inferSelect.status)[];

/** The open register lines for one step's open points, scoped to the company. */
export const openMeasureOf = (companyId: string, requirementId: string) =>
  and(
    eq(improvementItem.companyId, companyId),
    eq(improvementItem.source, MEASURE_SOURCE),
    eq(improvementItem.sourceReferenceId, requirementId),
    inArray(improvementItem.status, [...STILL_OPEN]),
  );

/**
 * Who takes care of each open point and by when, by step: the open lines the approval made,
 * oldest first, so a later line for the same step wins where a caller keys them by code. The
 * owner's name and email come only while they are in the company: someone who left keeps their
 * line, but their details stay out of the company's screens and export.
 */
export async function walkMeasuresOf(db: DbOrTx, companyId: string) {
  return db
    .select({
      code: requirement.code,
      assignedTo: improvementItem.assignedTo,
      ownerName: user.name,
      ownerEmail: user.email,
      targetDate: improvementItem.targetDate,
    })
    .from(improvementItem)
    .innerJoin(requirement, eq(requirement.id, improvementItem.sourceReferenceId))
    .leftJoin(
      companyMembership,
      and(
        eq(companyMembership.userId, improvementItem.assignedTo),
        eq(companyMembership.companyId, companyId),
      ),
    )
    .leftJoin(user, eq(user.id, companyMembership.userId))
    .where(
      and(
        eq(improvementItem.companyId, companyId),
        eq(improvementItem.source, MEASURE_SOURCE),
        inArray(improvementItem.status, [...STILL_OPEN]),
      ),
    )
    .orderBy(improvementItem.createdAt);
}
