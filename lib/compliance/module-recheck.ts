/**
 * Module recheck — keeps requirement sign-offs in sync with operational data.
 *
 * Two triggers:
 * 1. `recheckModuleRequirements` — on delete: reverts if count drops to zero.
 * 2. `invalidateModuleSignOffs` — on create/update: reverts because the new or
 *    changed data hasn't been reviewed under the existing sign-off.
 *
 * Fire-and-forget: callers should `.catch(() => {})`.
 */
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  companyAssessment,
  companyRequirementStatus,
  requirement,
} from "@/schema";
import { logAudit } from "@/lib/audit";
import type { DbOrTx } from "@/lib/db";

const TABLE_COUNT_SQL: Record<string, (db: DbOrTx, companyId: string) => Promise<number>> = {};

function registerTable(name: string) {
  TABLE_COUNT_SQL[name] = async (db, companyId) => {
    const result = await db.execute<{ cnt: number }>(
      sql`SELECT count(*)::int as cnt FROM ${sql.identifier(name)} WHERE company_id = ${companyId}`
    );
    return result.rows[0]?.cnt ?? 0;
  };
}

for (const name of [
  "asset", "risk", "incident", "supplier", "policy", "training_record",
  "exercise", "management_review", "kpi_measurement", "change_request",
  "patch_record", "vulnerability", "internal_audit", "improvement_item",
  "bsi_registration",
]) {
  registerTable(name);
}

TABLE_COUNT_SQL["bsi_incident_report"] = async (db, companyId) => {
  const result = await db.execute<{ cnt: number }>(
    sql`SELECT count(DISTINCT r.id)::int as cnt
        FROM bsi_incident_report r
        JOIN incident i ON r.incident_id = i.id
        WHERE i.company_id = ${companyId}`
  );
  return result.rows[0]?.cnt ?? 0;
};

interface RevertContext {
  companyId: string;
  userId: string | null;
  reason: "module_data_changed" | "module_data_deleted";
}

async function revertSignOffs(
  db: DbOrTx,
  moduleRef: string,
  ctx: RevertContext,
): Promise<void> {
  const assessments = await db
    .select({ id: companyAssessment.id })
    .from(companyAssessment)
    .where(eq(companyAssessment.companyId, ctx.companyId));

  if (assessments.length === 0) return;

  const assessmentIds = assessments.map((a) => a.id);

  const toRevert = await db
    .select({
      statusId: companyRequirementStatus.id,
      previousStatus: companyRequirementStatus.status,
      requirementCode: requirement.code,
    })
    .from(companyRequirementStatus)
    .innerJoin(requirement, eq(companyRequirementStatus.requirementId, requirement.id))
    .where(
      and(
        inArray(companyRequirementStatus.assessmentId, assessmentIds),
        inArray(companyRequirementStatus.status, ["completed", "approved"]),
        eq(requirement.moduleRef, moduleRef),
      ),
    );

  if (toRevert.length === 0) return;

  await db
    .update(companyRequirementStatus)
    .set({
      status: "needs_review",
      updatedAt: new Date(),
    })
    .where(inArray(companyRequirementStatus.id, toRevert.map((r) => r.statusId)));

  const reverted = toRevert.map((r) => ({
    code: r.requirementCode,
    statusId: r.statusId,
    previousStatus: r.previousStatus,
  }));
  const reasonText = ctx.reason === "module_data_changed" ? "data changed" : "data deleted (empty)";
  logAudit({
    companyId: ctx.companyId,
    userId: ctx.userId,
    action: "requirement.sign_off_invalidated",
    entityType: "module",
    entityId: moduleRef,
    description: `${moduleRef} ${reasonText} — reverted ${reverted.length} requirement(s): ${reverted.map((r) => r.code).join(", ")}`,
    previousValue: reverted,
    newValue: { status: "needs_review" },
  }).catch(() => {});
}

/**
 * Revert completed/approved requirements that reference this module.
 * Called on create/update — new or changed data invalidates the existing sign-off.
 */
export async function invalidateModuleSignOffs(
  db: DbOrTx,
  companyId: string,
  moduleRef: string,
  userId?: string | null,
): Promise<void> {
  if (!companyId) return;
  return revertSignOffs(db, moduleRef, {
    companyId,
    userId: userId ?? null,
    reason: "module_data_changed",
  });
}

/**
 * Check if a module table now has zero records for a company.
 * If so, revert any completed/approved requirements that reference this module.
 */
export async function recheckModuleRequirements(
  db: DbOrTx,
  companyId: string,
  moduleRef: string,
  userId?: string | null,
): Promise<void> {
  if (!companyId) return;

  const countFn = TABLE_COUNT_SQL[moduleRef];
  if (!countFn) return;

  const count = await countFn(db, companyId);
  if (count > 0) return;

  return revertSignOffs(db, moduleRef, {
    companyId,
    userId: userId ?? null,
    reason: "module_data_deleted",
  });
}
