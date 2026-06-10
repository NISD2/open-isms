/**
 * Dev CLI: Multi-persona BSIG panel evaluation.
 *
 * Usage:
 *   bun scripts/eval-panel.ts                        # structure mode, all 12 categories
 *   bun scripts/eval-panel.ts --mode data            # data mode
 *   bun scripts/eval-panel.ts --category GOV         # single category
 *   bun scripts/eval-panel.ts --category GOV --mode data
 */
import { eq } from "drizzle-orm";
import { writeFileSync } from "node:fs";
import { db } from "@/lib/db";
import { company, companyAssessment } from "@/schema";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { buildAiContext } from "@/lib/ai/build-context";
import { evaluateAllCategories, type PanelCategoryResult } from "@/lib/eval/panel-evaluate";
import type { FormatMode } from "@/lib/eval/format-category";
import type { MergedCategoryEvaluation, PanelEvaluationResult, Verdict } from "@/lib/eval/panel-schema";

// ANSI colors
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function verdictColor(verdict: Verdict): string {
  if (verdict === "pass") return GREEN;
  if (verdict === "partial") return YELLOW;
  return RED;
}

function verdictIcon(verdict: Verdict): string {
  const color = verdictColor(verdict);
  return `${color}${verdict.toUpperCase()}${RESET}`;
}

function progressBar(score: number, width = 10): string {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

function parseCli(): { mode: FormatMode; category?: string } {
  const args = process.argv.slice(2);
  let mode: FormatMode = "structure";
  let category: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mode" && args[i + 1]) {
      const val = args[i + 1];
      if (val !== "structure" && val !== "data") {
        console.error(`Invalid mode: ${val}. Use "structure" or "data".`);
        process.exit(1);
      }
      mode = val;
      i++;
    } else if (args[i] === "--category" && args[i + 1]) {
      category = args[i + 1].toUpperCase();
      i++;
    }
  }

  return { mode, category };
}

function printCategoryResult(result: PanelCategoryResult): void {
  const { merged } = result;
  const color = verdictColor(merged.overallVerdict);

  // Header
  console.log(`\n${"═".repeat(60)}`);
  console.log(
    `${BOLD}${merged.categoryCode}${RESET} — ${merged.categoryName}` +
    `${" ".repeat(Math.max(1, 40 - merged.categoryCode.length - merged.categoryName.length))}` +
    `${progressBar(merged.overallScore)} ${color}${merged.overallScore}%${RESET}`
  );
  console.log("═".repeat(60));

  // Persona summaries
  console.log(`\n${BOLD}Personas:${RESET}`);
  for (const ps of merged.personaSummaries) {
    const padded = ps.personaName.padEnd(28);
    const scoreStr = `${ps.score}%`.padStart(4);
    const truncSummary = ps.summary.length > 50 ? ps.summary.slice(0, 50) + "..." : ps.summary;
    console.log(`  ${padded} ${scoreStr}  ${verdictIcon(ps.verdict)}   ${DIM}"${truncSummary}"${RESET}`);
  }

  // Coverage
  const coveredCount = merged.coverage.filter((c) => c.covered).length;
  const totalCov = merged.coverage.length;
  console.log(`\n${BOLD}Coverage (${totalCov} BSIG expectations):${RESET}`);
  for (const cov of merged.coverage) {
    if (cov.covered) {
      console.log(`  ${GREEN}✓${RESET} ${cov.expectation}     ${DIM}(${cov.consensusLevel}/5 agree)${RESET}`);
    } else {
      console.log(`  ${RED}✗${RESET} ${cov.expectation}     ${RED}UNCOVERED${RESET} ${cov.gap ? `(${cov.gap.slice(0, 60)})` : ""}`);
      if (cov.coveringFields.length > 0) {
        console.log(`      ${DIM}Partial fields: ${cov.coveringFields.join(", ")}${RESET}`);
      }
    }
  }

  // Field summary
  const existing = merged.fields.filter((f) => f.status === "existing").length;
  const needsImprovement = merged.fields.filter((f) => f.status === "needs-improvement").length;
  const missing = merged.fields.filter((f) => f.status === "missing").length;
  console.log(`\n${BOLD}Fields:${RESET} ${existing} existing ${GREEN}✓${RESET} | ${needsImprovement} need improvement ${YELLOW}⚠${RESET} | ${missing} missing ${RED}✗${RESET}`);

  // Missing fields
  const missingFields = merged.fields.filter((f) => f.status === "missing");
  if (missingFields.length > 0) {
    console.log(`\n${BOLD}Missing fields:${RESET}`);
    for (const f of missingFields) {
      const sevColor = f.severity === "critical" ? RED : f.severity === "important" ? YELLOW : DIM;
      console.log(`  ${RED}✗${RESET} ${f.fieldKey} (${f.fieldType}) — ${sevColor}${f.severity.toUpperCase()}${RESET}`);
      console.log(`    ${DIM}"${f.rationale}"${RESET}`);
      console.log(`    ${DIM}Flagged by: ${f.flaggedBy.join(", ")}${RESET}`);
    }
  }

  // Needs improvement
  const improvementFields = merged.fields.filter((f) => f.status === "needs-improvement");
  if (improvementFields.length > 0) {
    console.log(`\n${BOLD}Improvement needed:${RESET}`);
    for (const f of improvementFields) {
      const note = f.improvementNote ?? f.rationale;
      console.log(`  ${YELLOW}⚠${RESET} ${f.fieldKey} — ${note.slice(0, 80)} ${DIM}(${f.flaggedBy.join(", ")})${RESET}`);
    }
  }

  // Data issues (data mode)
  if (merged.dataIssues.length > 0) {
    console.log(`\n${BOLD}Data issues:${RESET}`);
    for (const di of merged.dataIssues.slice(0, 10)) {
      const sevColor = di.severity === "critical" ? RED : di.severity === "important" ? YELLOW : DIM;
      console.log(`  ${sevColor}●${RESET} ${di.requirementCode} → ${di.fieldKey}: ${di.issue.slice(0, 70)}`);
      console.log(`    ${DIM}Fix: ${di.recommendation.slice(0, 70)}${RESET}`);
    }
    if (merged.dataIssues.length > 10) {
      console.log(`  ${DIM}... and ${merged.dataIssues.length - 10} more${RESET}`);
    }
  }

  // Top recommendations
  if (merged.mergedRecommendations.length > 0) {
    console.log(`\n${BOLD}Top recommendations:${RESET}`);
    for (const [i, rec] of merged.mergedRecommendations.slice(0, 5).entries()) {
      console.log(`  ${i + 1}. ${rec.text.slice(0, 70)} ${DIM}(${rec.frequency}/5 personas)${RESET}`);
    }
  }

  console.log(`\n  ${DIM}Evaluated in ${(result.durationMs / 1000).toFixed(1)}s${RESET}`);
}

function printFinalSummary(result: PanelEvaluationResult): void {
  const modeLabel = result.mode === "structure" ? "STRUCTURE MODE" : "DATA MODE";

  console.log(`\n${"═".repeat(60)}`);
  console.log(`${BOLD}BSIG PANEL EVALUATION — ${modeLabel}${RESET}`);
  console.log("═".repeat(60));

  for (const cat of result.categories) {
    const code = cat.categoryCode.padEnd(5);
    const name = cat.categoryName.padEnd(36);
    const score = `${cat.overallScore}%`.padStart(4);
    console.log(`  ${code}${name}${score}  ${verdictIcon(cat.overallVerdict)}`);
  }

  console.log("─".repeat(60));
  console.log(`  ${BOLD}Overall: ${verdictColor(result.overallVerdict)}${result.overallScore}%  ${result.overallVerdict.toUpperCase()}${RESET}`);
  console.log(`  ${result.categories.length} categories | ${result.totalLlmCalls} LLM calls | ${(result.durationMs / 1000).toFixed(1)}s`);
  console.log("");
  console.log(
    `  Fields: ${result.totalFields.existing} existing | ` +
    `${result.totalFields.needsImprovement} need improvement | ` +
    `${result.totalFields.missing} missing`
  );
  console.log(
    `  Coverage: ${result.totalCoverage.covered} covered | ` +
    `${result.totalCoverage.uncovered} uncovered BSIG expectations`
  );
  console.log("═".repeat(60));
}

async function main() {
  const { mode, category: filterCategory } = parseCli();
  const modeLabel = mode === "structure" ? "STRUCTURE" : "DATA";

  console.log(`${BOLD}BSIG Panel Evaluation — ${modeLabel} MODE${RESET}\n`);

  // Find first assessment, then resolve its company
  const assessment = await db.query.companyAssessment.findFirst();
  if (!assessment) {
    console.error("No assessment found. Run `bun db:seed` first.");
    process.exit(1);
  }

  const firstCompany = await db.query.company.findFirst({
    where: eq(company.id, assessment.companyId),
  });
  if (!firstCompany) {
    console.error("Assessment company not found.");
    process.exit(1);
  }

  console.log(`Company: ${firstCompany.name}`);
  console.log(`Assessment: ${assessment.id}`);

  // Load full report data
  const reportData = await loadReportData(assessment.id);
  console.log(`Categories: ${reportData.categories.length}`);
  console.log(`Requirements: ${reportData.totalRequirements} (${reportData.completedCount} completed)`);
  if (filterCategory) {
    console.log(`Filter: ${filterCategory}`);
  }

  // Build org context
  const orgContext = buildAiContext(
    {
      sector: firstCompany.sector,
      subSector: firstCompany.subSector,
      entityType: firstCompany.entityType,
      legalForm: firstCompany.legalForm,
      name: firstCompany.name,
      employeeCount: firstCompany.employeeCount,
      annualRevenue: firstCompany.annualRevenue,
    },
    firstCompany.aiDataSharing,
  );

  console.log(`\n${DIM}Running 5 personas per category...${RESET}`);

  // Evaluate
  const result = await evaluateAllCategories(
    reportData,
    mode,
    orgContext,
    (categoryResult) => {
      printCategoryResult(categoryResult);
    },
    filterCategory,
  );

  // Final summary
  printFinalSummary(result);

  // Write JSON
  const outPath = "eval-panel-results.json";
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\n${DIM}Full results written to ${outPath}${RESET}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
