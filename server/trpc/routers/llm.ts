import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, companyProcedure } from "../init";
import { extractFromText } from "@/lib/forms/llm-prefill-action";
import { company, companyAssessment } from "@/schema";
import { buildAiContext } from "@/lib/ai/build-context";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { evaluateSection as evalSection } from "@/lib/eval/evaluate-section";
import { evaluateAssessment } from "@/lib/eval/evaluate-assessment";
import { BSIG_SECTIONS } from "@/lib/eval/bsig-sections";
import { getNis2FrameworkId } from "../helpers/nis2-scope";

/**
 * Hard-fail any LLM call when the company has opted out of AI data sharing.
 *
 * `aiDataSharing === "none"` is the most restrictive setting and the settings
 * UI promises that no organisation data leaves the platform. The body content
 * (intake answers, pasted documents, sign-off snapshots) is exactly what users
 * mean by "data" — gating only the metadata via buildAiContext is insufficient.
 */
async function requireAiEnabled(
  database: typeof import("@/lib/db").db,
  companyId: string,
): Promise<void> {
  const row = await database.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { aiDataSharing: true },
  });
  if (!row || row.aiDataSharing === "none") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "AI features are disabled for this workspace. Enable them in Settings → AI to use this feature.",
    });
  }
}

const fieldSchema = z.object({
  key: z.string(),
  type: z.string(),
  label: z.string(),
  required: z.boolean(),
  enumValues: z.array(z.string()).optional(),
});

export const llmRouter = router({
  extract: companyProcedure
    .input(
      z.object({
        text: z.string().min(1).max(50_000),
        fields: z.array(fieldSchema).min(1),
        language: z.string().optional(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Honor the aiDataSharing="none" opt-out before sending text to xAI.
      await requireAiEnabled(ctx.db, ctx.companyId);

      const result = await extractFromText({
        text: input.text,
        fields: input.fields,
        language: input.language,
        context: input.context,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Extraction failed" });
      }

      return result.data;
    }),

  evaluateSection: companyProcedure
    .input(z.object({ categoryCode: z.string(), locale: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Honor the aiDataSharing="none" opt-out before loading sign-off snapshots.
      await requireAiEnabled(ctx.db, ctx.companyId);

      // NIS 2 only. Unscoped this graded whichever assessment Postgres
      // returned first, so /audit-readiness could score a tenant's GDPR
      // assessment and report it as their NIS 2 readiness.
      const nis2FrameworkId = await getNis2FrameworkId(ctx.db);
      const assessment = nis2FrameworkId
        ? await ctx.db.query.companyAssessment.findFirst({
            where: and(
              eq(companyAssessment.companyId, ctx.companyId),
              eq(companyAssessment.frameworkId, nis2FrameworkId),
            ),
          })
        : null;
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No assessment found" });
      }

      const reportData = await loadReportData(assessment.id, input.locale);
      const category = reportData.categories.find((c) => c.code === input.categoryCode);
      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Category ${input.categoryCode} not found` });
      }

      const bsig = BSIG_SECTIONS[input.categoryCode];
      const orgContext = await loadOrgContext(ctx.db, ctx.companyId);
      const evaluation = await evalSection(category, orgContext);

      return {
        categoryCode: category.code,
        categoryName: category.name,
        bsigSection: bsig?.bsigSection ?? "Unknown",
        evaluation,
      };
    }),

  evaluateAll: companyProcedure
    .input(z.object({ locale: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      // Honor the aiDataSharing="none" opt-out before loading sign-off snapshots.
      await requireAiEnabled(ctx.db, ctx.companyId);

      // NIS 2 only. Unscoped this graded whichever assessment Postgres
      // returned first, so /audit-readiness could score a tenant's GDPR
      // assessment and report it as their NIS 2 readiness.
      const nis2FrameworkId = await getNis2FrameworkId(ctx.db);
      const assessment = nis2FrameworkId
        ? await ctx.db.query.companyAssessment.findFirst({
            where: and(
              eq(companyAssessment.companyId, ctx.companyId),
              eq(companyAssessment.frameworkId, nis2FrameworkId),
            ),
          })
        : null;
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No assessment found" });
      }

      const reportData = await loadReportData(assessment.id, input?.locale);
      const orgContext = await loadOrgContext(ctx.db, ctx.companyId);
      return evaluateAssessment(reportData, orgContext);
    }),
});

async function loadOrgContext(
  database: typeof import("@/lib/db").db,
  companyId: string,
): Promise<string | null> {
  const row = await database
    .select({
      name: company.name,
      sector: company.sector,
      subSector: company.subSector,
      entityType: company.entityType,
      legalForm: company.legalForm,
      employeeCount: company.employeeCount,
      annualRevenue: company.annualRevenue,
      aiDataSharing: company.aiDataSharing,
    })
    .from(company)
    .where(eq(company.id, companyId))
    .then((rows) => rows[0] ?? null);

  if (!row) return null;
  return buildAiContext(row, row.aiDataSharing);
}
