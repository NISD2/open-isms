import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import {
  companyUploadPrefixes,
  createPresignedGet,
  createPresignedPut,
  deleteObject,
  normalizeContentType,
  sanitizeFilename,
} from "@/lib/storage";
import { MAX_UPLOAD_BYTES } from "@/lib/storage/limits";
import { removeReleasedObject } from "@/lib/storage/released-object";
import type { CourseId } from "@/lib/training/catalog";
import { courseGraduates } from "@/lib/training/company-course";
import { trainingRecord } from "@/schema";
import { trainingInsertSchema, trainingUpdateSchema } from "@/schema/validators";
import { assertOwnObjectKey, verifyMemberReferences } from "../guards";
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

/** The platform's course for management, which § 38 Abs. 3 BSIG training can be. */
const MANAGEMENT_COURSE: CourseId = "nis2-ceo";

/** Where getCertificateUploadUrl puts a company's certificates; the only keys a record may hold. */
const certificatePrefix = companyUploadPrefixes.trainingCertificates;

export const trainingRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.trainingRecord.findMany({
      where: eq(trainingRecord.companyId, ctx.companyId),
      orderBy: [desc(trainingRecord.createdAt)],
    });
  }),

  /** The company's members who finished the platform's course for management, read off their progress. */
  managementCourse: companyProcedure.query(({ ctx }) =>
    courseGraduates(ctx.db, ctx.companyId, MANAGEMENT_COURSE),
  ),

  create: companyProcedure
    .input(trainingInsertSchema.omit({ id: true, companyId: true, createdAt: true }))
    .mutation(async ({ ctx, input }) => {
      assertOwnObjectKey(certificatePrefix(ctx.companyId), input.certificateFileKey);
      await verifyMemberReferences(ctx.db, [input.userId], ctx.companyId);
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
      assertOwnObjectKey(
        certificatePrefix(ctx.companyId),
        input.training.certificateFileKey,
      );
      await verifyMemberReferences(
        ctx.db,
        input.participants.map((p) => p.userId),
        ctx.companyId,
      );
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
      const current = data.certificateFileKey
        ? await ctx.db.query.trainingRecord.findFirst({
            where: and(
              eq(trainingRecord.id, id),
              eq(trainingRecord.companyId, ctx.companyId),
            ),
            columns: { certificateFileKey: true },
          })
        : undefined;
      assertOwnObjectKey(
        certificatePrefix(ctx.companyId),
        data.certificateFileKey,
        current?.certificateFileKey,
      );
      await verifyMemberReferences(ctx.db, [data.userId], ctx.companyId);
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
      const [removed] = await ctx.db
        .delete(trainingRecord)
        .where(
          and(
            eq(trainingRecord.id, input.id),
            eq(trainingRecord.companyId, ctx.companyId),
          ),
        )
        .returning({ certificateFileKey: trainingRecord.certificateFileKey });
      await removeReleasedObject({
        key: removed?.certificateFileKey,
        prefix: certificatePrefix(ctx.companyId),
        // batchCreate gives every participant's row the same certificate.
        stillReferenced: async (key) =>
          (await ctx.db.query.trainingRecord.findFirst({
            where: and(
              eq(trainingRecord.companyId, ctx.companyId),
              eq(trainingRecord.certificateFileKey, key),
            ),
            columns: { id: true },
          })) !== undefined,
        remove: deleteObject,
        record: `training_record ${input.id}`,
      });
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
      const key = `${certificatePrefix(ctx.companyId)}${crypto.randomUUID()}-${sanitizeFilename(input.fileName)}`;
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
      // Checked again here, because rows written before the key was checked on write may hold any
      // key; one outside this company's prefix is treated as no certificate at all. A prefix test,
      // not isOwnObjectKey: keys issued before audit F-4 (2026-09-10) kept the raw filename, which
      // may hold a backslash, and the stricter check applies to keys when they are written.
      if (!row?.certificateFileKey?.startsWith(certificatePrefix(ctx.companyId))) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No certificate on this record",
        });
      }
      return { downloadUrl: await createPresignedGet(row.certificateFileKey) };
    }),
});
