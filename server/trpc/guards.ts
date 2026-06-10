import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { categoryAssignment, companyAssessment, companyRequirementStatus, user } from "@/schema";
import type { Database } from "@/lib/db";

/**
 * Verify that the given user is the category owner (or admin).
 * Throws FORBIDDEN if not.
 */
export async function enforceAssignment(
  db: Database,
  opts: {
    role: string;
    userId: string;
    assessmentId: string;
    categoryId: string;
  },
) {
  if (opts.role === "admin") return;

  const assignment = await db.query.categoryAssignment.findFirst({
    where: and(
      eq(categoryAssignment.assessmentId, opts.assessmentId),
      eq(categoryAssignment.categoryId, opts.categoryId),
      eq(categoryAssignment.userId, opts.userId),
    ),
  });

  if (!assignment) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not assigned to this category.",
    });
  }
}

/**
 * Verify that the given assessment belongs to the specified company.
 * Throws FORBIDDEN if not.
 */
export async function verifyAssessmentOwnership(
  db: Database,
  assessmentId: string,
  companyId: string,
): Promise<void> {
  const assessment = await db.query.companyAssessment.findFirst({
    where: and(
      eq(companyAssessment.id, assessmentId),
      eq(companyAssessment.companyId, companyId),
    ),
    columns: { id: true },
  });
  if (!assessment) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
}

/**
 * Look up a requirement status and verify it belongs to the caller's company.
 * Reused by assignment mutations and any status-scoped operations.
 */
export async function verifyStatusOwnership(
  db: Database,
  statusId: string,
  companyId: string,
) {
  const row = await db.query.companyRequirementStatus.findFirst({
    where: eq(companyRequirementStatus.id, statusId),
    columns: { assessmentId: true },
  });
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Requirement status not found" });
  }
  await verifyAssessmentOwnership(db, row.assessmentId, companyId);
  return row;
}

/** Look up the signer's jobTitle, falling back to session role. */
export async function getSignerRole(db: Database, userId: string, sessionRole: string): Promise<string> {
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { jobTitle: true },
  });
  return row?.jobTitle ?? sessionRole;
}
