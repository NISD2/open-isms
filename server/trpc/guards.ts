import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db";
import {
  asset,
  categoryAssignment,
  companyAssessment,
  companyMembership,
  companyRequirementStatus,
} from "@/schema";

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

/**
 * Verify that a referenced asset belongs to the caller's company. A record pointing at another
 * tenant's asset would confirm the asset exists and, through the foreign key, stop its owner
 * deleting it. Does nothing when no asset is referenced.
 */
export async function verifyAssetReference(
  db: Database,
  assetId: string | null | undefined,
  companyId: string,
): Promise<void> {
  if (!assetId) return;
  const row = await db.query.asset.findFirst({
    where: and(eq(asset.id, assetId), eq(asset.companyId, companyId)),
    columns: { id: true },
  });
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
}

/**
 * Verify that every referenced person is a member of the caller's company, for columns such as
 * an assignee or a training participant. Does nothing for an empty list.
 */
export async function verifyMemberReferences(
  db: Database,
  userIds: readonly (string | null | undefined)[],
  companyId: string,
): Promise<void> {
  const wanted = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (wanted.length === 0) return;
  const found = await db
    .select({ userId: companyMembership.userId })
    .from(companyMembership)
    .where(
      and(
        eq(companyMembership.companyId, companyId),
        inArray(companyMembership.userId, wanted),
      ),
    );
  if (found.length !== wanted.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found in your company" });
  }
}

/**
 * The role stamped on a sign-off: the signer's compliance role in the company they have open,
 * falling back to their membership role. Both come from the session, which resolves the open
 * company's membership on every request.
 */
export function signerRoleOf(session: { jobTitle: string | null; role: string }): string {
  return session.jobTitle ?? session.role;
}
