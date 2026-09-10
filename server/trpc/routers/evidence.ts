import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import { evidence, companyRequirementStatus, companyAssessment } from "@/schema";
import {
  createPresignedPut,
  createPresignedGet,
  deleteObject,
  normalizeContentType,
  sanitizeFilename,
} from "@/lib/storage";
import { enforceAssignment, verifyAssessmentOwnership } from "../guards";
import { randomUUID } from "crypto";

export const evidenceRouter = router({
  /** Request a presigned upload URL and create a draft evidence record */
  createUploadUrl: companyProcedure
    .input(
      z.object({
        requirementStatusId: z.string().uuid(),
        fileName: z.string().min(1).max(500),
        fileType: z.string().min(1).max(100),
        fileSize: z.number().int().positive().max(50 * 1024 * 1024),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Enforce assignment before allowing upload
      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, input.requirementStatusId),
        with: { requirement: { columns: { id: true, categoryId: true } } },
      });
      if (!statusRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Requirement status not found" });
      }
      await verifyAssessmentOwnership(ctx.db, statusRow.assessmentId, ctx.companyId);
      await enforceAssignment(ctx.db, {
        role: ctx.session.role,
        userId: ctx.userId,
        assessmentId: statusRow.assessmentId,
        categoryId: statusRow.requirement.categoryId,
      });

      // Audit F-4 (2026-09-10): the caller's filename decides part of the key
      // and the caller's fileType decides what a later presigned GET serves.
      // Neither is trusted raw — the supplier-portal upload paths have always
      // done both, this one did neither. `fileName` is still stored verbatim
      // on the row, so the download keeps the name the user recognises.
      const storedType = normalizeContentType(input.fileType);
      const storageKey = `evidence/${ctx.companyId}/${input.requirementStatusId}/${randomUUID()}-${sanitizeFilename(input.fileName)}`;

      // Create draft evidence record
      const [row] = await ctx.db
        .insert(evidence)
        .values({
          requirementStatusId: input.requirementStatusId,
          fileName: input.fileName,
          fileType: storedType,
          fileSize: input.fileSize,
          storageKey,
          uploadedBy: ctx.userId,
          status: "draft",
        })
        .returning();

      const uploadUrl = await createPresignedPut(storageKey, storedType, input.fileSize);

      // `contentType` is signed into `uploadUrl`, so the PUT has to send this
      // exact value back or S3 answers 403. The caller must not reuse
      // `file.type` here — it may be the value we just downgraded.
      return { uploadUrl, storageKey, evidenceId: row.id, contentType: storedType };
    }),

  /** Confirm upload completed — transition from draft to in_review */
  confirmUpload: companyProcedure
    .input(
      z.object({
        evidenceId: z.string().uuid(),
        contentHash: z.string().length(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.query.evidence.findFirst({
        where: eq(evidence.id, input.evidenceId),
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Evidence not found" });
      }

      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, row.requirementStatusId),
        with: { requirement: { columns: { id: true, categoryId: true } } },
      });
      if (!statusRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Requirement status not found" });
      }
      await verifyAssessmentOwnership(ctx.db, statusRow.assessmentId, ctx.companyId);
      await enforceAssignment(ctx.db, {
        role: ctx.session.role,
        userId: ctx.userId,
        assessmentId: statusRow.assessmentId,
        categoryId: statusRow.requirement.categoryId,
      });

      const [updated] = await ctx.db
        .update(evidence)
        .set({
          status: "in_review",
          contentHash: input.contentHash ?? null,
        })
        .where(
          and(
            eq(evidence.id, input.evidenceId),
            eq(evidence.status, "draft"),
          )
        )
        .returning();

      return updated;
    }),

  /** List all evidence for a requirement status, with download URLs */
  listByRequirementStatus: companyProcedure
    .input(z.object({ requirementStatusId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify the requirement status belongs to caller's company
      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, input.requirementStatusId),
        columns: { assessmentId: true },
      });
      if (!statusRow) return [];
      const [owned] = await ctx.db
        .select({ id: companyAssessment.id })
        .from(companyAssessment)
        .where(and(eq(companyAssessment.id, statusRow.assessmentId), eq(companyAssessment.companyId, ctx.companyId)))
        .limit(1);
      if (!owned) return [];

      const rows = await ctx.db.query.evidence.findMany({
        where: eq(evidence.requirementStatusId, input.requirementStatusId),
        orderBy: (e, { desc }) => [desc(e.uploadedAt)],
      });

      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          downloadUrl:
            row.status !== "draft"
              ? await createPresignedGet(row.storageKey)
              : null,
        }))
      );
    }),

  /** Get a single download URL */
  getDownloadUrl: companyProcedure
    .input(z.object({ evidenceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.evidence.findFirst({
        where: eq(evidence.id, input.evidenceId),
      });
      if (!row) return null;

      // Verify the evidence belongs to caller's company
      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, row.requirementStatusId),
        columns: { assessmentId: true },
      });
      if (!statusRow) return null;
      const [owned] = await ctx.db
        .select({ id: companyAssessment.id })
        .from(companyAssessment)
        .where(and(eq(companyAssessment.id, statusRow.assessmentId), eq(companyAssessment.companyId, ctx.companyId)))
        .limit(1);
      if (!owned) return null;

      return createPresignedGet(row.storageKey);
    }),

  /** Delete evidence from S3 and DB */
  deleteEvidence: companyProcedure
    .input(z.object({ evidenceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.query.evidence.findFirst({
        where: eq(evidence.id, input.evidenceId),
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Evidence not found" });
      }

      const statusRow = await ctx.db.query.companyRequirementStatus.findFirst({
        where: eq(companyRequirementStatus.id, row.requirementStatusId),
        with: { requirement: { columns: { id: true, categoryId: true } } },
      });
      if (!statusRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Requirement status not found" });
      }

      await verifyAssessmentOwnership(ctx.db, statusRow.assessmentId, ctx.companyId);
      await enforceAssignment(ctx.db, {
        role: ctx.session.role,
        userId: ctx.userId,
        assessmentId: statusRow.assessmentId,
        categoryId: statusRow.requirement.categoryId,
      });

      await deleteObject(row.storageKey);
      await ctx.db.delete(evidence).where(eq(evidence.id, input.evidenceId));

      return { deleted: true };
    }),
});
