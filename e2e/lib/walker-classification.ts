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
  CUSTOM_EDITOR_KEYS,
} from "@/lib/compliance/requirement-fields";

/**
 * Requirement codes whose page renders a custom structured editor, derived
 * from the product's own CUSTOM_EDITOR_KEYS registry (which the UI map in
 * RequirementDetail.tsx is compile-time typed against).
 */
export const UI_CUSTOM_EDITORS = new Set(
  CUSTOM_EDITOR_KEYS.map((k) => k.split(":")[1]),
);

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
