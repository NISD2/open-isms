import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import {
  createPresignedGet,
  createPresignedPut,
  normalizeContentType,
  sanitizeFilename,
} from "@/lib/storage";
import { MAX_UPLOAD_BYTES } from "@/lib/storage/limits";
import { trainingRecord } from "@/schema";
import { trainingInsertSchema, trainingUpdateSchema } from "@/schema/validators";
import { companyProcedure, router } from "../init";

/**
 * batchCreate writes one training_record row per participant, so its input
 * splits the columns shared by every row from the per-participant ones. Both
 * halves derive from trainingInsertSchema: the hand-written restatement this
 * replaced had drifted, typing the pg `date` column nextTrainingDue as a bare
 * string so free text reached Postgres as `invalid input syntax for type date`
 * (a 500, not a validation error), and silently dropping trainerQualification
 * and topicsCovered.
 */
const participantColumns = {
  userId: true,
  participantName: true,
  participantRole: true,
  isManagement: true,
} as const;

const batchCreateSchema = z.object({
  training: trainingInsertSchema.omit({
    ...participantColumns,
    id: true,
    companyId: true,
    createdAt: true,
  }),
  participants: z.array(trainingInsertSchema.pick(participantColumns)).min(1),
});

export const trainingRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.trainingRecord.findMany({
      where: eq(trainingRecord.companyId, ctx.companyId),
      orderBy: [desc(trainingRecord.createdAt)],
    });
  }),

  create: companyProcedure
    .input(trainingInsertSchema.omit({ id: true, companyId: true, createdAt: true }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(trainingRecord)
        .values({ ...input, companyId: ctx.companyId })
        .returning();
      invalidateModuleSignOffs(
        ctx.db,
        ctx.companyId,
        "training_record",
        ctx.userId,
      ).catch((err) => console.error("[background] training_record recheck:", err));
      return row;
    }),

  batchCreate: companyProcedure
    .input(batchCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db
        .insert(trainingRecord)
        .values(
          input.participants.map((p) => ({
            ...input.training,
            ...p,
            companyId: ctx.companyId,
          })),
        )
        .returning();
      invalidateModuleSignOffs(
        ctx.db,
        ctx.companyId,
        "training_record",
        ctx.userId,
      ).catch((err) => console.error("[background] training_record recheck:", err));
      return rows;
    }),

  update: companyProcedure
    .input(trainingUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [row] = await ctx.db
        .update(trainingRecord)
        .set(data)
        .where(
          and(eq(trainingRecord.id, id), eq(trainingRecord.companyId, ctx.companyId)),
        )
        .returning();
      invalidateModuleSignOffs(
        ctx.db,
        ctx.companyId,
        "training_record",
        ctx.userId,
      ).catch((err) => console.error("[background] training_record recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(trainingRecord)
        .where(
          and(
            eq(trainingRecord.id, input.id),
            eq(trainingRecord.companyId, ctx.companyId),
          ),
        );
      recheckModuleRequirements(
        ctx.db,
        ctx.companyId,
        "training_record",
        ctx.userId,
      ).catch((err) => console.error("[background] training:", err));
      return { deleted: true };
    }),

  // fileSize is bounded here the way evidence.createUploadUrl bounds it.
  // Without the ceiling, an oversized certificate reached createPresignedPut
  // and came back as a bare thrown Error rather than a validation failure —
  // which the uploader could only render as "upload failed".
  getCertificateUploadUrl: companyProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(500),
        contentType: z.string().min(1).max(100),
        fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Audit F-4 (2026-09-10): same treatment as evidence.createUploadUrl —
      // the filename does not get to shape the key, and the caller does not
      // get to choose a content type a browser will render. `contentType` is
      // returned because it is signed into the URL and the PUT must echo it.
      const storedType = normalizeContentType(input.contentType);
      const key = `companies/${ctx.companyId}/training-certs/${crypto.randomUUID()}-${sanitizeFilename(input.fileName)}`;
      const uploadUrl = await createPresignedPut(key, storedType, input.fileSize);
      return { uploadUrl, fileKey: key, contentType: storedType };
    }),

  /**
   * Presigned GET for a training record's certificate.
   *
   * Audit F-6 (2026-09-10): this used to take the object key from the caller
   * and admit it on a `startsWith("companies/<companyId>/")` prefix test. The
   * prefix did hold the tenant boundary, but it let a caller name any object
   * under their company's prefix, including keys no training_record points
   * at. Every other download path in the codebase resolves the key from a row
   * it has already checked ownership of; this one now does too.
   */
  getCertificateDownloadUrl: companyProcedure
    .input(z.object({ trainingRecordId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.trainingRecord.findFirst({
        where: and(
          eq(trainingRecord.id, input.trainingRecordId),
          eq(trainingRecord.companyId, ctx.companyId),
        ),
        columns: { certificateFileKey: true },
      });
      if (!row?.certificateFileKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No certificate on this record",
        });
      }
      return { downloadUrl: await createPresignedGet(row.certificateFileKey) };
    }),
});
