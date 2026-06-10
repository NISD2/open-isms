import { eq, inArray } from "drizzle-orm";
import type { DbOrTx as Database } from "@/lib/db";
import { requirementCategory, companyAssessment } from "@/schema";
import { getSlugsForRole, type RoleKey } from "@/lib/compliance/role-mapping";

/**
 * Resolve a compliance role to concrete category assignment rows.
 *
 * roleKey → DB relevant_roles query → category IDs → company assessments → assignment rows
 */
export async function resolveRoleAssignments(
  db: Database,
  companyId: string,
  roleKey: RoleKey,
  assignedBy: string,
): Promise<{ categoryId: string; assessmentId: string; assignedBy: string }[]> {
  const slugs = await getSlugsForRole(db, roleKey);
  if (slugs.length === 0) return [];

  const categories = await db.query.requirementCategory.findMany({
    where: inArray(requirementCategory.slug, slugs),
    columns: { id: true, frameworkId: true },
  });

  if (categories.length === 0) return [];

  const assessments = await db.query.companyAssessment.findMany({
    where: eq(companyAssessment.companyId, companyId),
    columns: { id: true, frameworkId: true },
  });

  const fwToAssessment = new Map(assessments.map((a) => [a.frameworkId, a.id]));

  return categories.flatMap((cat) => {
    const assessmentId = fwToAssessment.get(cat.frameworkId);
    if (!assessmentId) return [];
    return [{ categoryId: cat.id, assessmentId, assignedBy }];
  });
}
