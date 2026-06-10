import "@/lib/server-guard";
import { generateObject } from "ai";
import { createXai } from "@ai-sdk/xai";
import { z, type ZodObject, type ZodRawShape } from "zod";

import { env } from "@/lib/env";

const xai = createXai({ apiKey: env.XAI_API_KEY });

export interface FieldDescription {
  key: string;
  type: string;
  label: string;
  required: boolean;
  enumValues?: string[];
}

export interface ExtractResult {
  data: Record<string, unknown>;
  success: boolean;
  error?: string;
}

/**
 * Build a Zod schema from field descriptions sent by the client.
 */
function buildSchemaFromFields(fields: FieldDescription[]): ZodObject<ZodRawShape> {
  const shape: Record<string, z.ZodType> = {};

  for (const f of fields) {
    let zodType: z.ZodType;
    switch (f.type) {
      case "text":
      case "textarea":
      case "date":
        zodType = z.string();
        break;
      case "number":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "enum":
        zodType = f.enumValues?.length
          ? z.enum(f.enumValues as [string, ...string[]])
          : z.string();
        break;
      default:
        zodType = z.string();
    }
    shape[f.key] = f.required ? zodType : zodType.optional();
  }

  return z.object(shape);
}

/**
 * Extract structured data from unstructured text using xAI.
 * Accepts either a pre-built Zod schema or field descriptions.
 */
export async function extractFromText(input: {
  text: string;
  fields?: FieldDescription[];
  schema?: ZodObject<ZodRawShape>;
  language?: string;
  context?: string;
}): Promise<ExtractResult> {
  const { text, fields, language = "en", context } = input;

  const schema = input.schema ?? (fields ? buildSchemaFromFields(fields) : null);
  if (!schema) {
    return { data: {}, success: false, error: "No schema or fields provided" };
  }

  const languageName = new Intl.DisplayNames(["en"], { type: "language" }).of(language) ?? "English";
  const langHint = language !== "en"
    ? `The text is in ${languageName}. Extract values in the source language.`
    : "";

  const contextHint = context ? `Context: ${context}` : "";

  try {
    const result = await generateObject({
      model: xai("grok-4-1-fast-non-reasoning"),
      schema,
      system: `You are a data extraction assistant for a NIS2 compliance platform.
Extract structured data from unstructured text.

Rules:
- Only extract information explicitly present in the text.
- Do NOT hallucinate or infer missing data.
- Omit fields whose values cannot be found.
- For enum fields, match to the closest valid option.
- Preserve original values exactly as stated.
${langHint}
${contextHint}`.trim(),
      prompt: `Extract structured data from:

---
${text}
---

Return the extracted data matching the schema.`,
    });

    return { data: result.object as Record<string, unknown>, success: true };
  } catch (err) {
    return {
      data: {},
      success: false,
      error: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}
