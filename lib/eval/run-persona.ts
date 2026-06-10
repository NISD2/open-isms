import "@/lib/server-guard";
import { generateObject } from "ai";
import { createXai } from "@ai-sdk/xai";
import type { ReportCategory } from "@/lib/pdf/load-report-data";
import type { Persona } from "./personas";
import { personaEvaluationSchema, type PersonaEvaluation } from "./panel-schema";
import { BSIG_SECTIONS } from "./bsig-sections";
import { formatCategoryForPrompt, type FormatMode } from "./format-category";
import { env } from "@/lib/env";

const xai = createXai({ apiKey: env.XAI_API_KEY });

function buildSystemPrompt(
  persona: Persona,
  mode: FormatMode,
  orgContext: string | null,
): string {
  const parts = [
    persona.systemPrompt,
    "",
    "## Scoring Guidelines",
    "Score strictly: 90+ means genuinely audit-ready with complete evidence trail, 70-89 mostly there with minor gaps, 50-69 significant work needed, <50 major structural gaps.",
    "Verdict: pass (≥80), partial (50-79), fail (<50).",
    "",
    "## Platform Model: Prescribe, Customize, Sign",
    "This platform provides PRESCRIBED APPROACHES for each requirement — opinionated best-practice processes that companies adopt and confirm.",
    "Users do NOT write policies from scratch. They read the prescribed approach, fill in company-specific data points, and sign off.",
    "The form captures ONLY company-specific configuration (tool names, thresholds, frequencies, contact names) — NOT process descriptions.",
    "",
    "## Form Design Principles",
    "Available field types: text, select, multiselect, date, file, checkbox, number.",
    "- NO generic textareas — the prescribed approach handles 'describe your process'. If you see a textarea, flag it as needs-improvement.",
    "- Use SELECT for enumerable choices (methods, tools, frequencies, SLAs). Always suggest concrete options.",
    "- Use MULTISELECT for multiple-choice lists (covered topics, applicable tools, scope elements).",
    "- Use CHECKBOX for boolean confirmations (policy exists, feature enabled, process includes X).",
    "- Use NUMBER for measurable metrics (counts, percentages, budgets, durations).",
    "- Use DATE for specific dates (last review, next audit, training date).",
    "- Use TEXT only for genuinely company-specific short strings (names, IDs, versions) — NOT for process descriptions.",
    "- File uploads (`file` type) ONLY for genuinely external documents: third-party audit reports, certificates, org charts, existing policies.",
    "",
    "When suggesting MISSING fields, ALWAYS specify:",
    "- The exact field type",
    "- For selects/multiselects: list the concrete OPTIONS with value/label",
    "- Think: 'What specific data point would an auditor verify?'",
    "- Do NOT suggest textareas or 'describe your process' fields",
    "- Do NOT suggest generic 'Evidence Upload' file fields — the platform sign-off + form data IS the evidence",
    "",
    "## Field Naming Convention",
    "- For EXISTING fields: use the EXACT fieldKey shown in the form structure. NEVER rename existing fields.",
    "- For NEW (missing) fields: use `{REQ_CODE}_{descriptor}` format in camelCase, e.g. `GOV002_oversightReport`, `GOV006_orgChart`.",
    "- The requirement code prefix ensures unique keys and prevents naming collisions across personas.",
    "",
    "## Output Rules",
    "- List ALL fields: existing form fields + any missing fields you identify.",
    "- For each field, specify which BSIG audit expectation it addresses.",
    "- Be specific: use concrete field keys (camelCase), not vague descriptions.",
    "- When suggesting missing `file` fields, name them descriptively (e.g., `GOV006_orgChart`, `GOV003_trainingCertificates`) — they will render as full evidence uploaders.",
    "",
    "## Coverage Rules",
    "- Produce EXACTLY ONE coverage entry per numbered BSIG audit expectation in the prompt.",
    "- Set `expectationIndex` to the expectation's number from the prompt (1, 2, 3, etc.).",
    "- Copy the expectation text VERBATIM from the prompt — do NOT paraphrase or reword it.",
    "- If an expectation is covered by a DIFFERENT category (noted in the expectation text), mark it as `covered: true` with a note in `coveringFields` like `[COVERED_BY_TRN]`.",
    "",
    "## Digital Sign-Off Mechanism",
    "This platform has a built-in digital sign-off mechanism on every requirement:",
    "- `signedOffBy` (authenticated user ID via Google OAuth)",
    "- `signedOffAt` (immutable server timestamp)",
    "- `signOffSnapshot` (frozen copy of operational data at sign-off time)",
    "- SHA-256 content hash in audit trail",
    "This constitutes an eIDAS-compliant advanced electronic signature (AES): authenticated identity + timestamp + content hash + audit trail.",
    "For requirements with evidenceType `sign-off`: the platform sign-off IS the evidence. Do NOT suggest additional file uploads for board approvals, liability acknowledgments, or budget sign-offs.",
    "File uploads (`file` type fields) are needed ONLY for external documents: policies, org charts, RACI matrices, third-party certificates, meeting minutes, training proof.",
    "",
    "## Cross-Category Overlap",
    "Some BSIG expectations are covered by other categories in this platform. Do NOT flag these as gaps or suggest duplicate fields:",
    "- Employee cybersecurity training → covered by TRN category (§30(1) Nr. 7)",
    "- Risk registers and risk assessments → covered by RSK category (§30(1) Nr. 1)",
    "- Incident response procedures → covered by INC category (§32 BSIG)",
    "- Business continuity plans → covered by BCP category (§30(1) Nr. 3)",
    "- Access control policies → covered by ACC category (§30(1) Nr. 9)",
    "If a BSIG expectation in this section is primarily addressed by another category, mark it as covered with a note referencing the other category.",
  ];

  if (mode === "structure") {
    parts.push(
      "",
      "## Mode: STRUCTURE EVALUATION",
      "Evaluate FORM STRUCTURE only — are the right questions being asked?",
      "Do NOT evaluate data quality. The `dataIssues` array MUST be empty.",
      "Focus on: field completeness, field types, required/optional correctness, option coverage.",
    );
  } else {
    parts.push(
      "",
      "## Mode: DATA EVALUATION",
      "Evaluate both FORM STRUCTURE and FILLED DATA quality.",
      "Assess: Are answers specific enough? Do they provide auditable evidence?",
      "Flag vague, incomplete, or boilerplate answers in dataIssues.",
    );
  }

  if (orgContext) {
    parts.push("", `## Organization Context`, orgContext);
  }

  return parts.join("\n");
}

function buildUserPrompt(
  category: ReportCategory,
  mode: FormatMode,
): string {
  const bsig = BSIG_SECTIONS[category.code];
  if (!bsig) {
    throw new Error(`Unknown category code: ${category.code}`);
  }

  const expectations = bsig.auditExpectations
    .map((e, i) => `${i + 1}. ${e}`)
    .join("\n");

  return `Evaluate this section for BSIG audit readiness.

## Section: ${category.name} (${category.code})
## BSIG Reference: ${bsig.bsigSection} — ${bsig.sectionTitle}

## BSIG Audit Expectations (evaluate coverage of each):
${expectations}

## ${mode === "structure" ? "Requirement Structure" : "Current State of Requirements and Sign-Offs"}:
${formatCategoryForPrompt(category, mode)}

Total requirements in section: ${category.requirements.length}
${mode === "data" ? `Completed/approved: ${category.requirements.filter((r) => ["completed", "approved", "not_applicable"].includes(r.status)).length}` : ""}`;
}

export interface RunPersonaInput {
  persona: Persona;
  category: ReportCategory;
  mode: FormatMode;
  orgContext: string | null;
}

export interface RunPersonaResult {
  personaId: string;
  personaName: string;
  evaluation: PersonaEvaluation;
}

export async function runPersona(input: RunPersonaInput): Promise<RunPersonaResult> {
  const { persona, category, mode, orgContext } = input;

  const { object } = await generateObject({
    model: xai("grok-4-1-fast-reasoning"),
    schema: personaEvaluationSchema,
    system: buildSystemPrompt(persona, mode, orgContext),
    prompt: buildUserPrompt(category, mode),
  });

  return {
    personaId: persona.id,
    personaName: persona.name,
    evaluation: object,
  };
}
