/**
 * How the journey walker completes each requirement. All three primary
 * registries live in product code: CUSTOM_EDITOR_FIELDS (policy and
 * methodology editors), requirement.moduleRef from grc-data-model (the
 * platform module whose records evidence the requirement), and
 * REQUIREMENT_FIELD_MAP (intake fields). This file adds ONLY the codes the
 * product classifies through none of those.
 *
 * The L0 coverage test asserts every requirement code in grc-data-model
 * resolves here — a new requirement fails CI until it is classified,
 * usually for free via the product registries.
 */
import {
  REQUIREMENT_FIELD_MAP,
  CUSTOM_EDITOR_FIELDS,
} from "@/lib/compliance/requirement-fields";

/**
 * Mirror of the CUSTOM_EDITORS map in
 * components/compliance/RequirementDetail.tsx (a client component; importing
 * it here would drag React into the test runtime). It is a SUPERSET of
 * CUSTOM_EDITOR_FIELDS: 2.3, 2.4 and 5.3 render editors without appearing in
 * the guidance registry. If the two drift, the L1 intake spec fails on the
 * affected requirement with "no fields rendered".
 */
export const UI_CUSTOM_EDITORS = new Set([
  "2.1", "2.3", "2.4", "5.3", "9.1", "10.1", "6.1", "6.2", "6.4",
]);

/** Codes with no custom editor, no moduleRef, and no intake fields. */
export const EXTRA_MODULE_BACKED: Record<string, { route: string; note: string }> = {
  "2.3": { route: "/risks", note: "risk register module (no moduleRef in grc-data-model)" },
  "5.3": { route: "/risks", note: "supplier risk register (no moduleRef in grc-data-model)" },
  "9.2": { route: "/assets", note: "per-asset encryption fields (no moduleRef in grc-data-model)" },
};

export type InteractionKind =
  | "custom-editor"
  | "module"
  | "intake"
  | "unclassified";

/**
 * Priority: custom editor > module > intake. Codes can carry several
 * registrations (2.2 has an intake field AND moduleRef "asset"); the walker
 * drives the highest-priority surface and the intake fields ride along on
 * the same requirement page.
 */
export function classifyRequirement(
  code: string,
  moduleRef?: string | null,
): InteractionKind {
  if (code in CUSTOM_EDITOR_FIELDS || UI_CUSTOM_EDITORS.has(code)) {
    return "custom-editor";
  }
  if (moduleRef || code in EXTRA_MODULE_BACKED) return "module";
  if (code in REQUIREMENT_FIELD_MAP) return "intake";
  return "unclassified";
}
