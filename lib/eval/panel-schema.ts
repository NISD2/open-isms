import { z } from "zod";

const severityEnum = z.enum(["critical", "important", "nice-to-have"]);
const fieldStatusEnum = z.enum(["existing", "missing", "needs-improvement"]);
const verdictEnum = z.enum(["pass", "partial", "fail"]);

// Per-persona evaluation of a single field
const fieldEvaluationSchema = z.object({
  fieldKey: z.string().describe("Unique field key (existing DB key or proposed new key)"),
  fieldType: z.string().describe("Field type: text, textarea, select, multiselect, date, file, checkbox, number"),
  label: z.string().describe("Human-readable label for this field"),
  status: fieldStatusEnum.describe("existing = already in form, missing = should be added, needs-improvement = exists but insufficient"),
  rationale: z.string().describe("Why this field matters for BSIG audit"),
  severity: severityEnum.describe("How critical is this field for audit readiness"),
  auditExpectation: z.string().describe("Which BSIG audit expectation this field addresses"),
  suggestedOptions: z.array(z.string()).optional().describe("For select/multiselect: suggested option values"),
  improvementNote: z.string().optional().describe("For needs-improvement: what specifically should change"),
});

// Per-persona coverage assessment of a BSIG expectation
const coverageItemSchema = z.object({
  expectationIndex: z.number().int().min(1).describe("The 1-based index of the BSIG audit expectation from the prompt"),
  expectation: z.string().describe("The BSIG audit expectation text — copy VERBATIM from the prompt"),
  covered: z.boolean().describe("Whether this expectation is adequately addressed"),
  coveringFields: z.array(z.string()).describe("Field keys that address this expectation"),
  gap: z.string().optional().describe("If not covered: what is missing"),
});

// Per-persona data quality issue (data mode only)
const dataIssueSchema = z.object({
  requirementCode: z.string().describe("Requirement code, e.g. 1.1"),
  fieldKey: z.string().describe("Specific field key with the issue"),
  issue: z.string().describe("What is wrong with the current data"),
  recommendation: z.string().describe("Specific action to fix"),
  severity: severityEnum,
});

export const personaEvaluationSchema = z.object({
  fields: z.array(fieldEvaluationSchema).describe(
    "ALL fields: existing ones from the form + missing ones that should be added"
  ),
  coverage: z.array(coverageItemSchema).describe(
    "Assessment of each BSIG audit expectation for this section"
  ),
  dataIssues: z.array(dataIssueSchema).describe(
    "Data quality issues (empty array in structure mode)"
  ),
  score: z.number().min(0).max(100).describe("Audit readiness score 0-100"),
  verdict: verdictEnum.describe("pass (≥80), partial (50-79), fail (<50)"),
  summary: z.string().describe("2-3 sentence assessment from this persona's perspective"),
  topRecommendations: z.array(z.string()).describe("Top 3-5 prioritized recommendations"),
});

export type PersonaEvaluation = z.infer<typeof personaEvaluationSchema>;
export type FieldEvaluation = z.infer<typeof fieldEvaluationSchema>;
export type CoverageItem = z.infer<typeof coverageItemSchema>;
export type DataIssue = z.infer<typeof dataIssueSchema>;
export type Severity = z.infer<typeof severityEnum>;
export type FieldStatus = z.infer<typeof fieldStatusEnum>;
export type Verdict = z.infer<typeof verdictEnum>;

// Merged output types (after dedup across personas)

export interface MergedField {
  fieldKey: string;
  fieldType: string;
  label: string;
  status: FieldStatus;
  severity: Severity;
  rationale: string;
  auditExpectation: string;
  suggestedOptions?: string[];
  improvementNote?: string;
  flaggedBy: string[];
}

export interface MergedCoverage {
  expectationIndex: number;
  expectation: string;
  covered: boolean;
  coveringFields: string[];
  gap?: string;
  consensusLevel: number; // 0-5: how many personas agree
}

export interface MergedDataIssue {
  requirementCode: string;
  fieldKey: string;
  issue: string;
  recommendation: string;
  severity: Severity;
  flaggedBy: string[];
}

export interface PersonaSummary {
  personaId: string;
  personaName: string;
  score: number;
  verdict: Verdict;
  summary: string;
}

export interface MergedCategoryEvaluation {
  categoryCode: string;
  categoryName: string;
  fields: MergedField[];
  coverage: MergedCoverage[];
  dataIssues: MergedDataIssue[];
  overallScore: number;
  overallVerdict: Verdict;
  personaSummaries: PersonaSummary[];
  mergedRecommendations: Array<{ text: string; frequency: number }>;
}

export interface PanelEvaluationResult {
  mode: "structure" | "data";
  overallScore: number;
  overallVerdict: Verdict;
  categories: MergedCategoryEvaluation[];
  totalFields: { existing: number; needsImprovement: number; missing: number };
  totalCoverage: { covered: number; uncovered: number };
  totalLlmCalls: number;
  durationMs: number;
}
