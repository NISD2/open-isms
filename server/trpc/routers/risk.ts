import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import { recheckModuleRequirements, invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { insertRow, updateRow } from "../typed";
import { risk, riskAsset, riskSupplier, riskTreatment, companyRiskMethodology, asset, supplier } from "@/schema";
import { getDefaultMethodology, type ScaleLevel } from "@/lib/compliance/risk-methodology-defaults";
import {
  riskInsertSchema,
  riskUpdateSchema,
  riskAssetInsertSchema,
  riskSupplierInsertSchema,
  riskTreatmentInsertSchema,
  riskTreatmentUpdateSchema,
} from "@/schema/validators";

const scaleLevelSchema = z.object({
  value: z.number().int().min(1),
  label: z.string().min(1).max(100),
  description: z.string().max(500),
});

export const riskRouter = router({
  // --- Risk Methodology ---

  getMethodology: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return null;
    const existing = await ctx.db.query.companyRiskMethodology.findFirst({
      where: eq(companyRiskMethodology.companyId, ctx.companyId),
    });
    if (existing) return existing;

    // Lazy-init with BSI 200-3 defaults
    const defaults = getDefaultMethodology("en");
    const [row] = await ctx.db
      .insert(companyRiskMethodology)
      .values({
        companyId: ctx.companyId,
        name: defaults.name,
        likelihoodLevels: defaults.likelihoodLevels,
        impactLevels: defaults.impactLevels,
        acceptanceThreshold: defaults.acceptanceThreshold,
        includesOt: defaults.includesOt,
      })
      .onConflictDoNothing()
      .returning();

    // Race condition: another request created it first
    if (!row) {
      return ctx.db.query.companyRiskMethodology.findFirst({
        where: eq(companyRiskMethodology.companyId, ctx.companyId),
      });
    }
    return row;
  }),

  updateMethodology: companyProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        likelihoodLevels: z.array(scaleLevelSchema).min(2).max(6).optional(),
        impactLevels: z.array(scaleLevelSchema).min(2).max(6).optional(),
        acceptanceThreshold: z.number().int().min(1).optional(),
        includesOt: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Renumber levels sequentially if provided
      const normalize = (levels: ScaleLevel[]): ScaleLevel[] =>
        levels.map((l, i) => ({ ...l, value: i + 1 }));

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name != null) updates.name = input.name;
      if (input.likelihoodLevels) updates.likelihoodLevels = normalize(input.likelihoodLevels);
      if (input.impactLevels) updates.impactLevels = normalize(input.impactLevels);
      if (input.acceptanceThreshold != null) updates.acceptanceThreshold = input.acceptanceThreshold;
      if (input.includesOt != null) updates.includesOt = input.includesOt;

      const [row] = await ctx.db
        .update(companyRiskMethodology)
        .set(updates)
        .where(eq(companyRiskMethodology.companyId, ctx.companyId))
        .returning();

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No methodology found" });
      return row;
    }),

  // --- Risk Register ---

  list: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.risk.findMany({
      where: eq(risk.companyId, ctx.companyId),
      orderBy: [desc(risk.updatedAt)],
    });
  }),

  listWithAssets: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.risk.findMany({
      where: eq(risk.companyId, ctx.companyId),
      with: { riskAssets: { with: { asset: { columns: { id: true, name: true, type: true } } } } },
      orderBy: [desc(risk.updatedAt)],
    });
  }),

  listWithTreatments: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.risk.findMany({
      where: eq(risk.companyId, ctx.companyId),
      with: { treatments: { orderBy: [desc(riskTreatment.createdAt)] } },
      orderBy: [desc(risk.updatedAt)],
    });
  }),

  create: companyProcedure
    .input(riskInsertSchema.omit({ id: true, companyId: true, createdAt: true, updatedAt: true, riskScore: true }))
    .mutation(async ({ ctx, input }) => {
      const riskScore = input.likelihood * input.impact;
      const [row] = await ctx.db
        .insert(risk)
        .values(insertRow(risk, { ...input, riskScore, companyId: ctx.companyId }))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "risk", ctx.userId).catch((err) => console.error("[background] risk recheck:", err));
      return row;
    }),

  update: companyProcedure
    .input(riskUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const needsScoreCalc = data.likelihood != null || data.impact != null;
      const needsResidualCalc = data.residualLikelihood != null || data.residualImpact != null;

      let riskScore: number | undefined;
      let residualRiskScore: number | undefined;

      if (needsScoreCalc || needsResidualCalc) {
        const current = await ctx.db.query.risk.findFirst({
          where: and(eq(risk.id, id), eq(risk.companyId, ctx.companyId)),
          columns: { likelihood: true, impact: true, residualLikelihood: true, residualImpact: true },
        });
        if (!current) throw new TRPCError({ code: "NOT_FOUND" });

        if (needsScoreCalc) {
          riskScore = (data.likelihood ?? current.likelihood) * (data.impact ?? current.impact);
        }
        if (needsResidualCalc) {
          const rl = data.residualLikelihood ?? current.residualLikelihood;
          const ri = data.residualImpact ?? current.residualImpact;
          if (rl != null && ri != null) residualRiskScore = rl * ri;
        }
      }

      const updates = {
        ...data,
        updatedAt: new Date(),
        ...(riskScore != null ? { riskScore } : {}),
        ...(residualRiskScore != null ? { residualRiskScore } : {}),
        ...(data.acceptedAt != null ? { acceptedBy: ctx.userId } : {}),
      };
      const [row] = await ctx.db
        .update(risk)
        .set(updateRow(risk, updates))
        .where(and(eq(risk.id, id), eq(risk.companyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "risk", ctx.userId).catch((err) => console.error("[background] risk recheck:", err));
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const owned = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, input.id), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!owned) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.delete(riskTreatment).where(eq(riskTreatment.riskId, input.id));
      await ctx.db.delete(riskAsset).where(eq(riskAsset.riskId, input.id));
      await ctx.db.delete(riskSupplier).where(eq(riskSupplier.riskId, input.id));
      await ctx.db.delete(risk).where(eq(risk.id, input.id));
      recheckModuleRequirements(ctx.db, ctx.companyId, "risk", ctx.userId).catch((err) => console.error("[background] risk:", err));
      return { deleted: true };
    }),

  // --- Risk-Asset linking ---
  listAssets: companyProcedure
    .input(z.object({ riskId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, input.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.query.riskAsset.findMany({
        where: eq(riskAsset.riskId, input.riskId),
        with: { asset: { columns: { id: true, name: true } } },
      });
    }),

  linkAsset: companyProcedure
    .input(riskAssetInsertSchema.omit({ id: true, createdAt: true }))
    .mutation(async ({ ctx, input }) => {
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, input.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      // Both ends of the link must belong to the same tenant — otherwise a
      // user could link their own risk to ANOTHER tenant's asset and leak its
      // name through the listWithAssets join.
      const ownAsset = await ctx.db.query.asset.findFirst({
        where: and(eq(asset.id, input.assetId), eq(asset.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!ownAsset)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found in this company",
        });
      const [row] = await ctx.db.insert(riskAsset).values(insertRow(riskAsset, input)).returning();
      return row;
    }),

  unlinkAsset: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const link = await ctx.db.query.riskAsset.findFirst({
        where: eq(riskAsset.id, input.id),
        columns: { riskId: true },
      });
      if (!link) throw new TRPCError({ code: "NOT_FOUND" });
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, link.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.delete(riskAsset).where(eq(riskAsset.id, input.id));
      return { deleted: true };
    }),

  // --- Risk Treatments ---
  listTreatments: companyProcedure
    .input(z.object({ riskId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, input.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.query.riskTreatment.findMany({
        where: eq(riskTreatment.riskId, input.riskId),
        orderBy: [desc(riskTreatment.createdAt)],
      });
    }),

  createTreatment: companyProcedure
    .input(riskTreatmentInsertSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, input.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      const [row] = await ctx.db.insert(riskTreatment).values(insertRow(riskTreatment, input)).returning();
      return row;
    }),

  updateTreatment: companyProcedure
    .input(riskTreatmentUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const treatment = await ctx.db.query.riskTreatment.findFirst({
        where: eq(riskTreatment.id, id),
        columns: { riskId: true },
      });
      if (!treatment) throw new TRPCError({ code: "NOT_FOUND" });
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, treatment.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      const updates = { ...data, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(riskTreatment)
        .set(updateRow(riskTreatment, updates))
        .where(eq(riskTreatment.id, id))
        .returning();
      return row;
    }),

  deleteTreatment: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const treatment = await ctx.db.query.riskTreatment.findFirst({
        where: eq(riskTreatment.id, input.id),
        columns: { riskId: true },
      });
      if (!treatment) throw new TRPCError({ code: "NOT_FOUND" });
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, treatment.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.delete(riskTreatment).where(eq(riskTreatment.id, input.id));
      return { deleted: true };
    }),

  // --- Risk-Supplier linking ---

  listWithSuppliers: companyProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];
    return ctx.db.query.risk.findMany({
      where: eq(risk.companyId, ctx.companyId),
      with: { riskSuppliers: { with: { supplier: { columns: { id: true, name: true, riskLevel: true } } } } },
      orderBy: [desc(risk.updatedAt)],
    });
  }),

  linkSupplier: companyProcedure
    .input(riskSupplierInsertSchema.omit({ id: true, createdAt: true }))
    .mutation(async ({ ctx, input }) => {
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, input.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      // Both ends of the link must belong to the same tenant.
      const ownSupplier = await ctx.db.query.supplier.findFirst({
        where: and(
          eq(supplier.id, input.supplierId),
          eq(supplier.customerCompanyId, ctx.companyId),
        ),
        columns: { id: true },
      });
      if (!ownSupplier)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Supplier not found in this company",
        });
      const [row] = await ctx.db.insert(riskSupplier).values(insertRow(riskSupplier, input)).returning();
      return row;
    }),

  unlinkSupplier: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const link = await ctx.db.query.riskSupplier.findFirst({
        where: eq(riskSupplier.id, input.id),
        columns: { riskId: true },
      });
      if (!link) throw new TRPCError({ code: "NOT_FOUND" });
      const parentRisk = await ctx.db.query.risk.findFirst({
        where: and(eq(risk.id, link.riskId), eq(risk.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!parentRisk) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.delete(riskSupplier).where(eq(riskSupplier.id, input.id));
      return { deleted: true };
    }),
});
