/**
 * Regenerate the published artefacts from src/fields/*.ts:
 *
 *   data/supply-chain-questionnaire.json    — the questionnaire data, validated
 *   schema/supply-chain-questionnaire.schema.json — JSON Schema for non-TS consumers
 *
 * The TypeScript field files in src/fields/ are the source of truth.
 * Run after editing any of them:
 *
 *   bun run build:json
 *
 * CI runs this and fails if either artefact differs from what the TS would
 * generate (drift detection).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { supplierQuestionnaire } from "../src/data";
import { supplierQuestionnaireSchema } from "../src/schema";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const dataPath = join(root, "data", "supply-chain-questionnaire.json");
const dataOut = `${JSON.stringify(supplierQuestionnaire, null, 2)}\n`;
writeFileSync(dataPath, dataOut);

const schemaDir = join(root, "schema");
mkdirSync(schemaDir, { recursive: true });
const schemaPath = join(schemaDir, "supply-chain-questionnaire.schema.json");
// zod's own converter: zod-to-json-schema predates zod 4 and wrote an empty object for it.
const jsonSchema = {
  title: "SupplyChainQuestionnaire",
  ...z.toJSONSchema(supplierQuestionnaireSchema, { target: "draft-7" }),
};
const schemaOut = `${JSON.stringify(jsonSchema, null, 2)}\n`;
writeFileSync(schemaPath, schemaOut);

console.log(
  `OK: ${dataPath} (${supplierQuestionnaire.fields.length} fields, v${supplierQuestionnaire.version})`,
);
console.log(`OK: ${schemaPath}`);
