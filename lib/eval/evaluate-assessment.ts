import "@/lib/server-guard";
import { evaluateSection } from "./evaluate-section";
import { BSIG_SECTIONS } from "./bsig-sections";
import type { AssessmentEvaluation } from "./eval-schema";
import type { ReportData } from "@/lib/pdf/load-report-data";

export async function evaluateAssessment(
  reportData: ReportData,
  orgContext: string | null,
): Promise<AssessmentEvaluation> {
  const sectionResults = await Promise.all(
    reportData.categories.map(async (category) => {
      const bsig = BSIG_SECTIONS[category.code];
      const evaluation = await evaluateSection(category, orgContext);
      return {
        categoryCode: category.code,
        categoryName: category.name,
        bsigSection: bsig?.bsigSection ?? "Unknown",
        evaluation,
      };
    }),
  );

  const scores = sectionResults.map((s) => s.evaluation.score);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const hasAnyFail = sectionResults.some((s) => s.evaluation.verdict === "fail");
  const allPass = sectionResults.every((s) => s.evaluation.verdict === "pass");
  const overallVerdict = allPass ? "pass" : hasAnyFail ? "fail" : "partial";

  return {
    overallVerdict,
    overallScore,
    sections: sectionResults,
  };
}
