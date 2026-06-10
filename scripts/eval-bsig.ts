/**
 * Dev CLI: Evaluate BSIG audit readiness for NISD2.eu seed data.
 *
 * Usage: bun scripts/eval-bsig.ts
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { company, companyAssessment } from "@/schema";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { buildAiContext } from "@/lib/ai/build-context";
import { evaluateSection } from "@/lib/eval/evaluate-section";
import { BSIG_SECTIONS } from "@/lib/eval/bsig-sections";
import type { AssessmentEvaluation } from "@/lib/eval/eval-schema";
import { writeFileSync } from "node:fs";

const VERDICT_ICON: Record<string, string> = {
  pass: "\x1b[32m[PASS]\x1b[0m",
  partial: "\x1b[33m[PARTIAL]\x1b[0m",
  fail: "\x1b[31m[FAIL]\x1b[0m",
};

async function main() {
  console.log("BSIG Audit Readiness Evaluation\n");

  // Find NISD2.eu company
  const nisd2 = await db.query.company.findFirst({
    where: eq(company.name, "NISD2.eu"),
  });
  if (!nisd2) {
    console.error("NISD2.eu company not found. Run `bun db:seed` first.");
    process.exit(1);
  }

  // Find active assessment
  const assessment = await db.query.companyAssessment.findFirst({
    where: eq(companyAssessment.companyId, nisd2.id),
  });
  if (!assessment) {
    console.error("No assessment found for NISD2.eu.");
    process.exit(1);
  }

  console.log(`Company: ${nisd2.name}`);
  console.log(`Assessment: ${assessment.id}\n`);

  // Load full report data
  const reportData = await loadReportData(assessment.id);
  console.log(`Categories: ${reportData.categories.length}`);
  console.log(`Requirements: ${reportData.totalRequirements} (${reportData.completedCount} completed)\n`);

  // Build org context
  const orgContext = buildAiContext(
    {
      sector: nisd2.sector,
      subSector: nisd2.subSector,
      entityType: nisd2.entityType,
      legalForm: nisd2.legalForm,
      name: nisd2.name,
      employeeCount: nisd2.employeeCount,
      annualRevenue: nisd2.annualRevenue,
    },
    nisd2.aiDataSharing,
  );

  // Evaluate sections sequentially for readable output
  const sections: AssessmentEvaluation["sections"] = [];

  for (const category of reportData.categories) {
    const bsig = BSIG_SECTIONS[category.code];
    const label = `${category.code} — ${category.name}`;
    process.stdout.write(`Evaluating ${label}... `);

    const evaluation = await evaluateSection(category, orgContext);

    const icon = VERDICT_ICON[evaluation.verdict] ?? evaluation.verdict;
    console.log(`${icon} ${evaluation.score}% — ${evaluation.summary}`);

    if (evaluation.dataGaps.length > 0) {
      const critical = evaluation.dataGaps.filter((g) => g.severity === "critical");
      if (critical.length > 0) {
        console.log(`  Critical gaps: ${critical.map((g) => g.requirementCode).join(", ")}`);
      }
    }

    sections.push({
      categoryCode: category.code,
      categoryName: category.name,
      bsigSection: bsig?.bsigSection ?? "Unknown",
      evaluation,
    });
  }

  // Compute overall
  const scores = sections.map((s) => s.evaluation.score);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const hasAnyFail = sections.some((s) => s.evaluation.verdict === "fail");
  const allPass = sections.every((s) => s.evaluation.verdict === "pass");
  const overallVerdict = allPass ? "pass" : hasAnyFail ? "fail" : "partial";

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Overall: ${VERDICT_ICON[overallVerdict]} ${overallScore}%`);
  console.log(`  Pass: ${sections.filter((s) => s.evaluation.verdict === "pass").length}`);
  console.log(`  Partial: ${sections.filter((s) => s.evaluation.verdict === "partial").length}`);
  console.log(`  Fail: ${sections.filter((s) => s.evaluation.verdict === "fail").length}`);

  // Write JSON results
  const result: AssessmentEvaluation = { overallVerdict, overallScore, sections };
  const outPath = "eval-bsig-results.json";
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nDetailed results written to ${outPath}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
