import type {
  AssetLayer,
  InformationsverbundOutput,
  Inventory,
  InventoryAsset,
  QuestionStep,
} from "./types";
import { UNIVERSAL_QUESTIONS } from "./universal-questions";

// BSI-200-2 §8.1 — turn the wizard answers into the structured
// Informationsverbund (the five-layer output an auditor expects).
//
// One question option = one asset entry (Gruppenbildung principle applies:
// "all employee notebooks" = 1 asset, not N). The user can edit names and
// counts in the review step.

const ID_PREFIX: Record<AssetLayer, string> = {
  geschaeftsprozess: "P",
  anwendung: "A",
  "it-system": "S",
  raum: "R",
  kommunikation: "N",
};

interface ResolveOpts {
  /** Resolve the user-visible name for an asset implied by a question option.
   *  Caller passes a translator (next-intl) so locale + i18n live in the
   *  components, not in this pure scoring code. */
  resolveAssetName: (
    questionId: string,
    optionId: string,
    layer: AssetLayer,
  ) => string;
}

function nextId(layer: AssetLayer, counters: Record<AssetLayer, number>): string {
  counters[layer]++;
  return `${ID_PREFIX[layer]}${String(counters[layer]).padStart(3, "0")}`;
}

/**
 * Classify the wizard answers into a structured Informationsverbund.
 * Pure function: caller provides i18n through `opts.resolveAssetName`.
 */
export function classifyInventory(
  inventory: Inventory,
  questions: QuestionStep[],
  opts: ResolveOpts,
): InformationsverbundOutput {
  const counters: Record<AssetLayer, number> = {
    geschaeftsprozess: 0,
    anwendung: 0,
    "it-system": 0,
    raum: 0,
    kommunikation: 0,
  };

  const all: InventoryAsset[] = [];
  for (const question of questions) {
    const selected = inventory.answers[question.id] ?? [];
    for (const optionId of selected) {
      const option = question.options.find((o) => o.id === optionId);
      if (!option) continue;
      for (const implies of option.implies) {
        all.push({
          id: nextId(implies.layer, counters),
          layer: implies.layer,
          name: opts.resolveAssetName(question.id, optionId, implies.layer),
          category: implies.category,
          defaultExposure: implies.defaultExposure,
          source: { questionId: question.id, optionId },
        });
      }
    }
  }

  return {
    geschaeftsprozesse: all.filter((a) => a.layer === "geschaeftsprozess"),
    anwendungen: all.filter((a) => a.layer === "anwendung"),
    itSysteme: all.filter((a) => a.layer === "it-system"),
    raeume: all.filter((a) => a.layer === "raum"),
    kommunikationsverbindungen: all.filter((a) => a.layer === "kommunikation"),
  };
}

export function emptyInventory(): Inventory {
  return { sectors: [], answers: {} };
}

/** Total assets captured across all layers, for the progress badge. */
export function countAssets(output: InformationsverbundOutput): number {
  return (
    output.geschaeftsprozesse.length +
    output.anwendungen.length +
    output.itSysteme.length +
    output.raeume.length +
    output.kommunikationsverbindungen.length
  );
}

/** Default question set used by the public /strukturanalyse page. */
export function defaultQuestionsFor(_inventory: Inventory): QuestionStep[] {
  // PR 1: universal only. PR 3 will add sector-specific filtering here.
  return UNIVERSAL_QUESTIONS;
}
