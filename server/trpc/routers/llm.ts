import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { buildAiContext } from "@/lib/ai/build-context";
import { BSIG_SECTIONS } from "@/lib/eval/bsig-sections";
import { evaluateAssessment } from "@/lib/eval/evaluate-assessment";
import { evaluateSection as evalSection } from "@/lib/eval/evaluate-section";
import { extractFromText } from "@/lib/forms/llm-prefill-action";
import { isLocaleCode } from "@/lib/locale";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { rateLimit } from "@/lib/rate-limit";
import { company } from "@/schema";
import { getNis2Assessment } from "../helpers/nis2-scope";
import { companyProcedure, router } from "../init";

/**
 * Model calls each company may start per hour, per procedure. Every call is a
 * paid request to xAI and nothing else bounds how often a signed-in member can
 * loop one; evaluateAll fans out to one call per assessment category, so it gets
 * the smallest budget. Sized well above a person working through forms by hand:
 * one extraction is one paste into one form.
 */
export const LLM_CALLS_PER_HOUR = {
  extract: 60,
  evaluateSection: 30,
  evaluateAll: 5,
} as const;

const HOUR_MS = 60 * 60 * 1000;

async function requireLlmBudget(
  procedure: keyof typeof LLM_CALLS_PER_HOUR,
  companyId: string,
): Promise<void> {
  if (
    !(await rateLimit(
      `llm:${procedure}:${companyId}`,
      LLM_CALLS_PER_HOUR[procedure],
      HOUR_MS,
    ))
  ) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Your organization has reached the hourly limit for AI requests. Please try again later.",
    });
  }
}

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

/**
 * Every field description becomes part of the JSON schema sent to the model,
 * so the caps bound the prompt as much as the text does. The forms that call
 * this (SchemaForm with llmPrefill) send at most 92 fields, keys of at most 35
 * characters and enum lists of at most 18 values of at most 22 characters (the
 * company form's sector list).
 */
const fieldSchema = z.object({
  key: z.string().min(1).max(64),
  type: z.string().max(16),
  label: z.string().max(300),
  required: z.boolean(),
  enumValues: z.array(z.string().max(64)).max(50).optional(),
});

/** Refined rather than z.enum so callers can pass useLocale()'s plain string. */
const localeSchema = z.string().refine(isLocaleCode, "Unsupported locale");

export const extractInputSchema = z.object({
  text: z.string().min(1).max(50_000),
  fields: z.array(fieldSchema).min(1).max(120),
  // Reaches Intl.DisplayNames, which throws on a malformed tag.
  language: localeSchema.optional(),
  // Spliced into the system prompt. No form passes it today.
  context: z.string().max(2_000).optional(),
});

export const evaluateSectionInputSchema = z.object({
  categoryCode: z.string().min(1).max(16),
  locale: localeSchema.optional(),
});

export const evaluateAllInputSchema = z
  .object({ locale: localeSchema.optional() })
  .optional();

export const llmRouter = router({
  extract: companyProcedure.input(extractInputSchema).mutation(async ({ ctx, input }) => {
    await requireLlmBudget("extract", ctx.companyId);
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
    .input(evaluateSectionInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireLlmBudget("evaluateSection", ctx.companyId);
      // Honor the aiDataSharing="none" opt-out before loading sign-off snapshots.
      await requireAiEnabled(ctx.db, ctx.companyId);

      // NIS 2 only. Unscoped this graded whichever assessment Postgres
      // returned first, so /audit-readiness could score a tenant's GDPR
      // assessment and report it as their NIS 2 readiness.
      const assessment = await getNis2Assessment(ctx.db, ctx.companyId);
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No assessment found" });
      }

      const reportData = await loadReportData(assessment.id, input.locale);
      const category = reportData.categories.find((c) => c.code === input.categoryCode);
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Category ${input.categoryCode} not found`,
        });
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
    .input(evaluateAllInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireLlmBudget("evaluateAll", ctx.companyId);
      // Honor the aiDataSharing="none" opt-out before loading sign-off snapshots.
      await requireAiEnabled(ctx.db, ctx.companyId);

      // NIS 2 only. Unscoped this graded whichever assessment Postgres
      // returned first, so /audit-readiness could score a tenant's GDPR
      // assessment and report it as their NIS 2 readiness.
      const assessment = await getNis2Assessment(ctx.db, ctx.companyId);
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
