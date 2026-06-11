import { supplierQuestionnaireSchema, } from "./schema";
import { allFields } from "./fields";
/**
 * Source of truth lives in `src/fields/<section>.ts` (TypeScript with full
 * type safety on label, type, section, and Baustein IDs). The bundled JSON
 * artefact at `data/supply-chain-questionnaire.json` is generated from these
 * files via `bun run build:json` and shipped for non-TS consumers.
 *
 * Bump these constants when shipping a release; CI will fail if the
 * generated JSON falls out of sync.
 */
export const VERSION = "3.1.0";
export const LAST_UPDATED = "2026-05-15";
export const supplierQuestionnaire = supplierQuestionnaireSchema.parse({
    version: VERSION,
    lastUpdated: LAST_UPDATED,
    fields: allFields,
});
export function groupBySection(q) {
    const out = new Map();
    for (const field of q.fields) {
        const list = out.get(field.section) ?? [];
        list.push(field);
        out.set(field.section, list);
    }
    return out;
}
export function visibleFields(q, response) {
    return q.fields.filter((field) => {
        if (!field.visibleWhen)
            return true;
        return response[field.visibleWhen.field] === field.visibleWhen.equals;
    });
}
//# sourceMappingURL=data.js.map