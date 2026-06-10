import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { insertRow, updateRow } from "../typed";
import { internalAudit, auditFinding } from "@/schema";
import {
  internalAuditInsertSchema,
  internalAuditUpdateSchema,
  auditFindingInsertSchema,
  auditFindingUpdateSchema,
} from "@/schema/validators";

export const internalAuditRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.internalAudit.findMany({
      where: eq(internalAudit.companyId, ctx.companyId),
      orderBy: [desc(internalAudit.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(internalAuditInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const values = { ...input, companyId: ctx.companyId };
      const [row] = await ctx.db
        .insert(internalAudit)
        .values(insertRow(internalAudit, values))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "internal_audit", ctx.userId).catch((err) => console.error("[background] internal_audit recheck:", err));
      return row;
    }),

  update: companyProcedure
    .input(internalAuditUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updates = { ...data, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(internalAudit)
        .set(updateRow(internalAudit, updates))
        .where(and(eq(internalAudit.id, id), eq(internalAudit.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "internal_audit", ctx.userId).catch((err) => console.error("[background] internal_audit recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(internalAudit)
        .where(and(eq(internalAudit.id, input.id), eq(internalAudit.companyId, ctx.companyId)));
      recheckModuleRequirements(ctx.db, ctx.companyId, "internal_audit", ctx.userId).catch((err) => console.error("[background] internal-audit:", err));
      return { deleted: true };
    }),

  // --- Findings ---
  listFindings: companyProcedure
    .input(z.object({ auditId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const parentAudit = await ctx.db.query.internalAudit.findFirst({
        where: and(eq(internalAudit.id, input.auditId), eq(internalAudit.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentAudit) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.query.auditFinding.findMany({
        where: eq(auditFinding.auditId, input.auditId),
        orderBy: [desc(auditFinding.createdAt)],
      });
    }),

  createFinding: companyProcedure
    .input(auditFindingInsertSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const parentAudit = await ctx.db.query.internalAudit.findFirst({
        where: and(eq(internalAudit.id, input.auditId), eq(internalAudit.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentAudit) throw new TRPCError({ code: "NOT_FOUND" });
      const [row] = await ctx.db.insert(auditFinding).values(insertRow(auditFinding, input)).returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "internal_audit", ctx.userId).catch((err) => console.error("[background] internal_audit recheck:", err));
      return row;
    }),

  updateFinding: companyProcedure
    .input(auditFindingUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const finding = await ctx.db.query.auditFinding.findFirst({
        where: eq(auditFinding.id, id),
        columns: { auditId: true },
      });
      if (!finding) throw new TRPCError({ code: "NOT_FOUND" });
      const parentAudit = await ctx.db.query.internalAudit.findFirst({
        where: and(eq(internalAudit.id, finding.auditId), eq(internalAudit.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentAudit) throw new TRPCError({ code: "NOT_FOUND" });
      const updates = { ...data, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(auditFinding)
        .set(updateRow(auditFinding, updates))
        .where(eq(auditFinding.id, id))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "internal_audit", ctx.userId).catch((err) => console.error("[background] internal_audit recheck:", err));
      return row;
    }),

  deleteFinding: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const finding = await ctx.db.query.auditFinding.findFirst({
        where: eq(auditFinding.id, input.id),
        columns: { auditId: true },
      });
      if (!finding) throw new TRPCError({ code: "NOT_FOUND" });
      const parentAudit = await ctx.db.query.internalAudit.findFirst({
        where: and(eq(internalAudit.id, finding.auditId), eq(internalAudit.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentAudit) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.delete(auditFinding).where(eq(auditFinding.id, input.id));
      return { deleted: true };
    }),
});
