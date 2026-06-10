/**
 * LLM-powered generation of per-requirement compliance guidance.
 *
 * Produces structured guidance (summary, field hints, evidence examples)
 * using xAI's grok model via Vercel AI SDK's generateObject.
 *
 * Called by scripts/generate-guidance.ts — NOT at runtime.
 */

import "@/lib/server-guard";
import { generateObject } from "ai";
import { createXai } from "@ai-sdk/xai";
import { z } from "zod";
import type { RequirementGuidanceData } from "./guidance-types";

import { env } from "@/lib/env";

const xai = createXai({ apiKey: env.XAI_API_KEY });

const fieldGuidanceSchema = z.object({
  key: z.string().describe("The field key exactly as provided in the input"),
  label: z.string().describe("Human-friendly field label"),
  meaning: z.string().describe("Plain-language explanation of what this field captures (1 sentence)"),
  example: z.string().describe("One realistic example value"),
  whereToFind: z.string().describe("Where in the organization to find this information"),
});

const guidanceSchema = z.object({
  summary: z.string().describe("1-2 simple sentences: what does the company need to do, and how do they know they're done?"),
  applicability: z.string().describe("In plain language: who needs to do this and who can skip it? (1 sentence)"),
  quickTip: z.string().describe("One practical first step for someone starting from zero"),
  implementationSteps: z.string().describe("3-5 simple action steps. Use plain verbs ('write down', 'ask your IT lead', 'get your board to sign'). Newline separated."),
  evidenceExample: z.string().describe("What type of document or proof to upload. Describe what it should SHOW, not what to name it. E.g. 'Board meeting minutes showing cybersecurity was discussed and approved' not 'A PDF named Vorstandsbeschluss_1.1.pdf'."),
  fieldGuidance: z.array(fieldGuidanceSchema).describe("Per-field guidance, one entry per input field"),
});

export interface GenerationInput {
  requirementCode: string;
  requirementTitle: string;
  description: string;
  evidenceType: string;
  legalRef: string | null;
  frameworkRef: string | null;
  categoryName: string;
  categoryCode: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    options?: readonly string[];
  }>;
  locale: "en" | "de";
}

export async function generateRequirementGuidance(
  input: GenerationInput,
): Promise<RequirementGuidanceData> {
  const languageName = input.locale === "de" ? "German" : "English";

  const fieldList = input.fields
    .map((f) => {
      const opts = f.options?.length ? `, options: ${f.options.join(", ")}` : "";
      return `- key="${f.key}" label="${f.label}" (${f.type}${opts}, ${f.required ? "required" : "optional"})`;
    })
    .join("\n");

  const dbLayers = [
    input.description && `Description: ${input.description}`,
  ]
    .filter(Boolean)
    .join("\n");

  const langRule = input.locale === "en"
    ? "Write ENTIRELY in English. Do NOT use any German words — no 'Geschäftsführung' (say 'management board'), no 'Informationssicherheitsleitlinie' (say 'information security policy'), no 'Vorstandsbeschluss' (say 'board resolution'). Translate ALL German terms."
    : "Write ENTIRELY in German. Use standard German business language.";

  const system = [
    "You are helping someone who has NEVER used a compliance platform before understand what they need to do.",
    langRule,
    "",
    "Your reader is a non-technical manager at a 50-250 employee German company. They don't know compliance jargon. Explain like you're talking to a smart friend over coffee.",
    "",
    "Rules:",
    "- Use short, simple sentences. No jargon without explanation.",
    "- Don't invent specific filenames or document titles — the user will name their own files.",
    "- Don't prescribe exact formats (page counts, section headings). Say WHAT needs to be in the document, not exactly how it should look.",
    "- For evidence: describe the TYPE of document (e.g. 'a signed board meeting summary' not 'a PDF named Vorstandsbeschluss_1.1_2024.pdf'). Say what it should prove, not what it should be called.",
    "- For implementation steps: focus on the actions ('get your board to approve this', 'write down who is responsible') not the compliance framework structure.",
    "- Consider ISO 27001 alignment to inform your guidance but do not mention ISO references in the output.",
    "- For field guidance: explain what the field captures in plain language, give a realistic example value, and say where to find the answer.",
  ].join("\n");

  const prompt = `Category: ${input.categoryName} (${input.categoryCode})
Requirement: ${input.requirementCode} — ${input.requirementTitle}
Legal reference: ${input.legalRef ?? "N/A"}
Framework reference: ${input.frameworkRef ?? "N/A"}
Evidence type: ${input.evidenceType}

--- Requirement context ---
${dbLayers}

--- Form fields for this requirement ---
${fieldList || "No form fields for this requirement."}

Generate guidance for this requirement. The "fieldGuidance" array must have one entry per field key listed above (if any). Use the exact field keys.`;

  const { object } = await generateObject({
    model: xai("grok-4-1-fast-non-reasoning"),
    schema: guidanceSchema,
    system,
    prompt,
  });

  // Convert array to record keyed by field name (UI expects Record<string, FieldGuidance>)
  const fields: RequirementGuidanceData["fields"] = {};
  for (const fg of object.fieldGuidance) {
    fields[fg.key] = {
      label: fg.label,
      meaning: fg.meaning,
      example: fg.example,
      whereToFind: fg.whereToFind,
    };
  }

  return {
    summary: object.summary,
    applicability: object.applicability,
    quickTip: object.quickTip,
    implementationSteps: object.implementationSteps,
    evidenceExample: object.evidenceExample,
    fields,
  };
}
