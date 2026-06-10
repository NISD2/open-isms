import { z } from "zod";

export const sectionEvaluationSchema = z.object({
  verdict: z.enum(["pass", "partial", "fail"]).describe(
    "Overall verdict: pass (audit-ready), partial (needs work), fail (major gaps)"
  ),
  score: z.number().min(0).max(100).describe(
    "Audit readiness score 0-100"
  ),
  summary: z.string().describe(
    "2-3 sentence overview of this section's audit readiness"
  ),
  structureGaps: z.array(z.object({
    description: z.string().describe("What form field or data point is missing"),
    severity: z.enum(["critical", "important", "nice-to-have"]),
  })).describe("Missing form fields or structural gaps in the questionnaire"),
  dataGaps: z.array(z.object({
    requirementCode: z.string().describe("The requirement code, e.g. 1.1"),
    fieldKey: z.string().nullable().describe("Specific field key, or null if general"),
    issue: z.string().describe("What is insufficient about the current answer"),
    recommendation: z.string().describe("Specific action to fix this gap"),
    severity: z.enum(["critical", "important", "nice-to-have"]),
  })).describe("Insufficient or missing answers in filled data"),
  strengths: z.array(z.string()).describe(
    "What this section does well — specific positive observations"
  ),
  recommendations: z.array(z.string()).describe(
    "Prioritized list of actions to improve audit readiness"
  ),
});

export type SectionEvaluation = z.infer<typeof sectionEvaluationSchema>;

export interface AssessmentEvaluation {
  overallVerdict: "pass" | "partial" | "fail";
  overallScore: number;
  sections: Array<{
    categoryCode: string;
    categoryName: string;
    bsigSection: string;
    evaluation: SectionEvaluation;
  }>;
}
