import "@/lib/server-guard";
import { generateObject } from "ai";
import { createXai } from "@ai-sdk/xai";
import { sectionEvaluationSchema, type SectionEvaluation } from "./eval-schema";
import { BSIG_SECTIONS } from "./bsig-sections";
import type { ReportCategory } from "@/lib/pdf/load-report-data";

import { env } from "@/lib/env";

const xai = createXai({ apiKey: env.XAI_API_KEY });

function formatCategoryForPrompt(category: ReportCategory): string {
  const lines: string[] = [];

  // Intake form data (primary source — BSI-aligned category form)
  if (category.intakeAnswers && Object.keys(category.intakeAnswers).length > 0) {
    lines.push("\n## Category Intake Form Answers:");
    if (category.intakeSignedOffAt) {
      lines.push(`Signed off at: ${category.intakeSignedOffAt.toISOString()}`);
    }
    for (const [key, value] of Object.entries(category.intakeAnswers)) {
      const label = key.replace(/([A-Z])/g, " $1").trim();
      lines.push(`  ${label}: ${formatValue(value)}`);
    }
    lines.push("");
  }

  // Grundschutz module reference
  if (category.grundschutzModule) {
    lines.push(`IT-Grundschutz Module: ${category.grundschutzModule}`);
  }

  // Per-requirement status data (for granular view)
  lines.push("\n## Per-requirement status:");
  let notStartedCount = 0;

  for (const req of category.requirements) {
    if (req.status === "not_started" && !req.signedOffRole) {
      notStartedCount++;
      continue;
    }

    lines.push(`\n### ${req.code}: ${req.title}`);
    lines.push(`Status: ${req.status}`);
    if (req.legalRef) lines.push(`Legal ref: ${req.legalRef}`);
    lines.push(`Evidence files: ${req.evidence.length}`);

    if (req.signedOffRole) {
      lines.push(`Signed off by: ${req.signedOffRole}`);
      if (req.signedOffAt) lines.push(`Signed off at: ${req.signedOffAt.toISOString()}`);
    }

    if (req.signOffSnapshot?.derivedData) {
      lines.push("Operational data:");
      for (const [key, value] of Object.entries(req.signOffSnapshot.derivedData)) {
        lines.push(`  ${key}: ${JSON.stringify(value)}`);
      }
    }
  }

  if (notStartedCount > 0) {
    lines.push(`\n(${notStartedCount} requirements not yet started — no sign-off)`);
  }

  return lines.join("\n");
}

function formatValue(val: unknown): string {
  if (val === true) return "Yes";
  if (val === false) return "No";
  if (val === null || val === undefined) return "Not provided";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val);
}

export async function evaluateSection(
  category: ReportCategory,
  orgContext: string | null,
): Promise<SectionEvaluation> {
  const bsig = BSIG_SECTIONS[category.code];
  if (!bsig) {
    throw new Error(`Unknown category code: ${category.code}`);
  }

  const hasIntake = category.intakeAnswers && Object.keys(category.intakeAnswers).length > 0;

  const systemParts = [
    "You are a BSIG/NIS2 compliance auditor evaluating an organization's audit readiness.",
    "Assess both the STRUCTURE (are the right questions asked?) and the DATA (are the answers specific enough for an audit?).",
    "Be specific and actionable. Reference requirement codes in your gaps.",
    "Score strictly: 90+ means genuinely audit-ready, 70-89 means mostly there, 50-69 significant work needed, <50 major gaps.",
    "",
    "The platform uses a category-level intake form model:",
    "- Each BSI measure area has ~6-10 curated questions targeting specific audit expectations.",
    "- Company profile data (CISO, budget, BSI contact) is auto-populated from setup.",
    "- Operational data (asset count, risk count, incident count) is derived from platform modules.",
    "- A sign-off with intake form answers + operational data backing is stronger than a sign-off alone.",
    "",
    hasIntake
      ? "This category HAS a completed intake form. Evaluate the quality and specificity of the answers."
      : "This category does NOT have a completed intake form. Evaluate based on per-requirement sign-offs.",
  ];

  if (orgContext) {
    systemParts.push(`\nOrganization context: ${orgContext}`);
  }

  const prompt = `Evaluate this section for BSIG audit readiness.

## Section: ${category.name}
## BSIG Reference: ${bsig.bsigSection} — ${bsig.sectionTitle}
${category.grundschutzModule ? `## Grundschutz Module: ${category.grundschutzModule}` : ""}

## What an auditor expects for this section:
${bsig.auditExpectations.map((e) => `- ${e}`).join("\n")}

## Current state:
${formatCategoryForPrompt(category)}

Total requirements in section: ${category.requirements.length}
Completed/approved: ${category.requirements.filter((r) => ["completed", "approved", "not_applicable"].includes(r.status)).length}
`;

  const { object } = await generateObject({
    model: xai("grok-3-fast"),
    schema: sectionEvaluationSchema,
    system: systemParts.join("\n"),
    prompt,
  });

  return object;
}
