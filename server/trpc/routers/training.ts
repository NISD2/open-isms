import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { trainingRecord } from "@/schema";
import { trainingInsertSchema, trainingUpdateSchema } from "@/schema/validators";
import { createPresignedPut, createPresignedGet } from "@/lib/storage";

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
    .input(
      z.object({
        training: z.object({
          trainingType: z.string().min(1).max(255),
          title: z.string().min(1).max(500),
          description: z.string().nullish(),
          providerName: z.string().max(255).nullish(),
          trainerName: z.string().max(255).nullish(),
          startedAt: z.coerce.date().nullish(),
          completedAt: z.coerce.date().nullish(),
          durationMinutes: z.number().int().positive().nullish(),
          nextTrainingDue: z.string().nullish(),
          certificateFileKey: z.string().max(500).nullish(),
        }),
        participants: z
          .array(
            z.object({
              userId: z.string().uuid().nullish(),
              participantName: z.string().min(1).max(255),
              participantRole: z.string().max(255).nullish(),
              isManagement: z.boolean(),
            }),
          )
          .min(1),
      }),
    )
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
