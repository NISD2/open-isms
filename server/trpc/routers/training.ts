import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { trainingRecord } from "@/schema";
import { trainingInsertSchema, trainingUpdateSchema } from "@/schema/validators";
import { createPresignedPut, createPresignedGet } from "@/lib/storage";

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
  training: trainingInsertSchema.omit({ ...participantColumns, id: true, companyId: true, createdAt: true }),
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
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "training_record", ctx.userId).catch((err) => console.error("[background] training_record recheck:", err));
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
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "training_record", ctx.userId).catch((err) => console.error("[background] training_record recheck:", err));
      return rows;
    }),

  update: companyProcedure
    .input(trainingUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [row] = await ctx.db
        .update(trainingRecord)
        .set(data)
        .where(and(eq(trainingRecord.id, id), eq(trainingRecord.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "training_record", ctx.userId).catch((err) => console.error("[background] training_record recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(trainingRecord)
        .where(and(eq(trainingRecord.id, input.id), eq(trainingRecord.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "training_record", ctx.userId).catch((err) => console.error("[background] training:", err));
      return { deleted: true };
    }),

  getCertificateUploadUrl: companyProcedure
    .input(z.object({ fileName: z.string(), contentType: z.string(), fileSize: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const key = `companies/${ctx.companyId}/training-certs/${crypto.randomUUID()}-${input.fileName}`;
      const uploadUrl = await createPresignedPut(key, input.contentType, input.fileSize);
      return { uploadUrl, fileKey: key };
    }),

  getCertificateDownloadUrl: companyProcedure
    .input(z.object({ fileKey: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!input.fileKey.startsWith(`companies/${ctx.companyId}/`)) {
        throw new Error("Access denied");
      }
      return { downloadUrl: await createPresignedGet(input.fileKey) };
    }),
});
