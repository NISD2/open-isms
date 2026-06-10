import { and, eq, inArray, sql } from "drizzle-orm";
import {
  company,
  companyAssessment,
  companyRequirementStatus,
} from "@/schema";
import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";
import type { Database } from "@/lib/db";
import { recordSignOffChainEntry } from "./sign-off-chain";

/** Build a sign-off snapshot capturing company profile + operational counts at sign-off time */
export async function buildSignOffSnapshot(
  db: Database,
  companyId: string,
  templateVersion: number,
): Promise<SignOffSnapshot> {
  const [companyRow, countRows] = await Promise.all([
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: {
        cisoName: true,
        cisoReportsTo: true,
        bsiContactName: true,
        bsiContactEmail: true,
        bsiContactPhone: true,
        bsiRegistrationId: true,
        annualSecurityBudget: true,
        primaryLocations: true,
      },
    }),
    db.execute<{ name: string; cnt: number }>(sql`
      SELECT 'asset'::text AS name, count(*)::int AS cnt FROM asset WHERE company_id = ${companyId}
      UNION ALL SELECT 'risk', count(*)::int FROM risk WHERE company_id = ${companyId}
      UNION ALL SELECT 'incident', count(*)::int FROM incident WHERE company_id = ${companyId}
      UNION ALL SELECT 'supplier', count(*)::int FROM supplier WHERE customer_company_id = ${companyId}
      UNION ALL SELECT 'policy', count(*)::int FROM policy WHERE company_id = ${companyId}
      UNION ALL SELECT 'training_record', count(*)::int FROM training_record WHERE company_id = ${companyId}
    `),
  ]);

  const derivedData: Record<string, unknown> = {};
  for (const row of countRows.rows) {
    derivedData[row.name] = { total: row.cnt };
  }

  const companyProfile: Record<string, unknown> = {};
  if (companyRow) {
    for (const [key, val] of Object.entries(companyRow)) {
      if (val !== null && val !== undefined) companyProfile[key] = val;
    }
  }

  return { templateVersion, derivedData, companyProfile };
}

/** Recalculate and persist assessment progress counters */
export async function recalculateProgress(
  db: Database,
  assessmentId: string,
) {
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

/**
 * Propagate a sign-off across linked requirements (cross-framework
 * satisfaction). When the user signs requirement X, BFS through the
 * satisfaction graph and credit every reachable requirement Y.
 *
 * Edge kinds:
 *   - `equivalent` pairs share the same underlying artefact (same supplier
 *     register, same incident row, same methodology). BFS continues through
 *     these edges so a chain X-eq-Y-eq-Z credits all three.
 *   - `overlapping` pairs only justify direct credit. BFS does NOT continue
 *     past them, so partial conceptual overlap cannot smuggle unrelated
 *     requirements into the credited set.
 *
 * Role gate (audit B-4, 2026-06-10): a credit is only applied when the
 * target's `requiredSignOffRole` matches the source signer's role (or the
 * source signer was admin). Without the gate, signing a CISO-required
 * requirement (e.g. SUP-5.1) was crediting linked CEO-required requirements
 * with `signedOffRole=ciso`, which a §38 BSIG auditor reads as a CISO
 * signing for the board.
 *
 * Chain (audit B-2): every credited target gets a `sign_off_history`
 * entry with `source: "module"` inside the same tx as its status update.
 * Without these, verifySignOffChain short-circuits to valid=true on every
 * propagated row and the integrity story collapses.
 *
 * Idempotent: skips status rows already in 'completed' or 'approved'.
 *
 * Returns the requirement IDs that received credit.
 */
export async function propagateSatisfaction(
  db: Database,
  args: {
    sourceRequirementId: string;
    companyId: string;
    userId: string;
    signedOffRole: string;
    snapshot: SignOffSnapshot;
  },
): Promise<string[]> {
  const { sourceRequirementId, companyId, userId, signedOffRole, snapshot } = args;

  const allEdges = await db.query.requirementSatisfaction.findMany();
  if (allEdges.length === 0) return [];

  const adjacency = new Map<
    string,
    Array<{ neighbor: string; kind: "equivalent" | "overlapping" }>
  >();
  for (const edge of allEdges) {
    const aList = adjacency.get(edge.requirementAId) ?? [];
    aList.push({ neighbor: edge.requirementBId, kind: edge.equivalenceKind });
    adjacency.set(edge.requirementAId, aList);

    const bList = adjacency.get(edge.requirementBId) ?? [];
    bList.push({ neighbor: edge.requirementAId, kind: edge.equivalenceKind });
    adjacency.set(edge.requirementBId, bList);
  }

  const visited = new Set<string>([sourceRequirementId]);
  const toCredit = new Set<string>();
  const queue: string[] = [sourceRequirementId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;

    for (const { neighbor, kind } of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      toCredit.add(neighbor);
      if (kind === "equivalent") {
        queue.push(neighbor);
      }
    }
  }

  if (toCredit.size === 0) return [];

  const tenantAssessments = await db
    .select({ id: companyAssessment.id })
    .from(companyAssessment)
    .where(eq(companyAssessment.companyId, companyId));
  const tenantAssessmentIds = tenantAssessments.map((a) => a.id);
  if (tenantAssessmentIds.length === 0) return [];

  const targetStatuses = await db.query.companyRequirementStatus.findMany({
    where: and(
      inArray(companyRequirementStatus.requirementId, [...toCredit]),
      inArray(companyRequirementStatus.assessmentId, tenantAssessmentIds),
    ),
    with: {
      requirement: { columns: { templateVersion: true, requiredSignOffRole: true } },
    },
  });

  const propagated: string[] = [];
  const assessmentsToRecalculate = new Set<string>();
  const now = new Date();
  const signerIsAdmin = signedOffRole === "admin";

  await db.transaction(async (tx) => {
    for (const target of targetStatuses) {
      if (target.status === "completed" || target.status === "approved") continue;

      const required = target.requirement.requiredSignOffRole;
      // Skip if the target requires a specific role that the source signer
      // did not satisfy. Admin sign-off bypasses for parity with signOff,
      // which lets admins close requirements without a role match.
      if (required && required !== signedOffRole && !signerIsAdmin) {
        continue;
      }

      await tx
        .update(companyRequirementStatus)
        .set({
          status: "completed",
          signedOffBy: userId,
          signedOffAt: now,
          signedOffRole,
          signedOffTemplateVersion: target.requirement.templateVersion,
          signOffSnapshot: snapshot,
          completedAt: now,
          completedBy: userId,
          updatedAt: now,
        })
        .where(eq(companyRequirementStatus.id, target.id));

      await recordSignOffChainEntry(tx as unknown as Database, {
        companyId,
        statusId: target.id,
        requirementId: target.requirementId,
        signedOffBy: userId,
        signedOffRole,
        source: "module",
        templateVersion: target.requirement.templateVersion,
        companyProfile: snapshot.companyProfile ?? {},
        data: { sourceRequirementId, propagation: "cross-framework" },
      });

      propagated.push(target.requirementId);
      assessmentsToRecalculate.add(target.assessmentId);
    }
  });

  for (const assessmentId of assessmentsToRecalculate) {
    await recalculateProgress(db, assessmentId);
  }

  return propagated;
}
