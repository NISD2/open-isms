import type { ReportCategory, ReportData } from "@/lib/pdf/load-report-data";
import type { FormatMode } from "./format-category";
import { PERSONAS } from "./personas";
import { runPersona, type RunPersonaResult } from "./run-persona";
import { mergePersonaResults } from "./merge-results";
import type {
  MergedCategoryEvaluation,
  PanelEvaluationResult,
  Verdict,
} from "./panel-schema";

const MAX_RETRIES = 2;

export interface PanelCategoryResult {
  merged: MergedCategoryEvaluation;
  personaResults: RunPersonaResult[];
  durationMs: number;
  failedPersonas: string[];
}

async function runPersonaWithRetry(
  input: Parameters<typeof runPersona>[0],
): Promise<RunPersonaResult | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await runPersona(input);
    } catch (err) {
      const label = `${input.persona.shortName}/${input.category.code}`;
      if (attempt < MAX_RETRIES) {
        console.error(`  ⚠ ${label} attempt ${attempt + 1} failed, retrying...`);
      } else {
        console.error(`  ✗ ${label} failed after ${MAX_RETRIES + 1} attempts, skipping.`);
      }
    }
  }
  return null;
}

/**
 * Run all 5 personas in parallel for a single category, then merge results.
 * Retries failed personas up to MAX_RETRIES times; skips if still failing.
 */
export async function evaluateCategoryPanel(
  category: ReportCategory,
  mode: FormatMode,
  orgContext: string | null,
): Promise<PanelCategoryResult> {
  const start = Date.now();

  const settled = await Promise.all(
    PERSONAS.map((persona) =>
      runPersonaWithRetry({ persona, category, mode, orgContext }),
    ),
  );

  const personaResults: RunPersonaResult[] = [];
  const failedPersonas: string[] = [];
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result) {
      personaResults.push(result);
    } else {
      failedPersonas.push(PERSONAS[i].shortName);
    }
  }

  if (personaResults.length === 0) {
    throw new Error(`All personas failed for ${category.code}`);
  }

  const merged = mergePersonaResults(
    category.code,
    category.name,
    personaResults,
  );

  return {
    merged,
    personaResults,
    durationMs: Date.now() - start,
    failedPersonas,
  };
}

function scoreToVerdict(score: number): Verdict {
  if (score >= 80) return "pass";
  if (score >= 50) return "partial";
  return "fail";
}

/**
 * Run panel evaluation for all categories sequentially.
 * Returns merged results + per-category callback for progress output.
 */
export async function evaluateAllCategories(
  reportData: ReportData,
  mode: FormatMode,
  orgContext: string | null,
  onCategoryDone?: (result: PanelCategoryResult, index: number) => void,
  filterCategory?: string,
): Promise<PanelEvaluationResult> {
  const start = Date.now();
  const categories = filterCategory
    ? reportData.categories.filter((c) => c.code === filterCategory)
    : reportData.categories;

  if (filterCategory && categories.length === 0) {
    throw new Error(`Category "${filterCategory}" not found. Available: ${reportData.categories.map((c) => c.code).join(", ")}`);
  }

  const results: MergedCategoryEvaluation[] = [];
  let totalLlmCalls = 0;

  for (let i = 0; i < categories.length; i++) {
    const result = await evaluateCategoryPanel(categories[i], mode, orgContext);
    results.push(result.merged);
    totalLlmCalls += PERSONAS.length;
    onCategoryDone?.(result, i);
  }

  // Compute totals
  const scores = results.map((r) => r.overallScore);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const hasLowScore = scores.some((s) => s < 40);
  const cappedScore = hasLowScore ? Math.min(overallScore, 60) : overallScore;

  const totalFields = {
    existing: 0,
    needsImprovement: 0,
    missing: 0,
  };
  const totalCoverage = { covered: 0, uncovered: 0 };

  for (const result of results) {
    for (const f of result.fields) {
      if (f.status === "existing") totalFields.existing++;
      else if (f.status === "needs-improvement") totalFields.needsImprovement++;
      else totalFields.missing++;
    }
    for (const c of result.coverage) {
      if (c.covered) totalCoverage.covered++;
      else totalCoverage.uncovered++;
    }
  }

  return {
    mode,
    overallScore: cappedScore,
    overallVerdict: scoreToVerdict(cappedScore),
    categories: results,
    totalFields,
    totalCoverage,
    totalLlmCalls,
    durationMs: Date.now() - start,
  };
}
