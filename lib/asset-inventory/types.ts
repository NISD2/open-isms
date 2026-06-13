// Asset inventory — primary-source aligned with BSI-200-2 §8.1.
//
// Strukturanalyse §8.1 organises the Informationsverbund along five
// "wesentliche Komponenten" (BSI online course Lektion 3.3-3.7):
//   1. Geschäftsprozesse (und Informationen) — §3.3
//   2. Anwendungen — §3.4
//   3. IT-Systeme (incl. virtual, ICS, IoT) — §3.6
//   4. Räume (Liegenschaften, Gebäude, Räume) — §3.7
//   5. Kommunikationsverbindungen (Netzplan) — §3.5
//
// §8.1 also defines the Gruppenbildung rule (Komplexitätsreduktion durch
// Gruppenbildung): components may be grouped when they share Typ,
// Schutzbedarf, Konfiguration, Anwendungen, Netzanbindung, Administration,
// and Raumkategorie. "45 identische Notebooks" = 1 asset entry.

export type AssetLayer =
  | "geschaeftsprozess"
  | "anwendung"
  | "it-system"
  | "raum"
  | "kommunikation";

export const ASSET_LAYERS: AssetLayer[] = [
  "geschaeftsprozess",
  "anwendung",
  "it-system",
  "raum",
  "kommunikation",
];

// Default exposure inferred from how the asset is typically reached. Seeds
// the risk-assessment Reach axis without asking the user a second time.
export type Exposure = "internet" | "internal" | "partner" | "physical-only";

// NIS2 Directive (EU) 2022/2555 Annex I + II identifiers.
export type NIS2Annex = "I" | "II";

// Essential = Annex I large; Important = Annex I medium or Annex II at
// medium-or-above.  We display this as a chip so users can see what level
// of supervision their sector implies.
export type NIS2Regime = "essential" | "important";

export interface NIS2Sector {
  /** Stable kebab-case id used in URLs, i18n keys, and answer storage. */
  id: string;
  annex: NIS2Annex;
  regime: NIS2Regime;
}

// ─── Wizard question shape ────────────────────────────────────────

export interface QuestionStep {
  /** Stable id used in i18n keys and answer storage. */
  id: string;
  /** Which BSI layer this step's captured assets belong to. */
  layer: AssetLayer;
  /** Undefined = universal (shown to everyone). Otherwise sector-gated. */
  appliesToSectors?: string[];
  options: QuestionOption[];
}

export interface QuestionOption {
  /** Stable id used in i18n keys and the inferred-asset name. */
  id: string;
  /** Asset(s) created when the user ticks this option. */
  implies: AssetImplication[];
}

export interface AssetImplication {
  layer: AssetLayer;
  /** Category code from lib/compliance/asset-types.ts NIS2_ASSET_TYPES, or
   *  "process" / "room" (added by this tool — BSI §8.1 layers that the
   *  existing platform taxonomy doesn't currently cover). */
  category: string;
  defaultExposure: Exposure;
}

// ─── Wizard state + output ────────────────────────────────────────

/** User's in-progress inventory state. */
export interface Inventory {
  sectors: string[];
  /** questionId → selected option ids (multi-select). */
  answers: Record<string, string[]>;
}

/** A single asset captured for the final Informationsverbund. */
export interface InventoryAsset {
  /** Generated id of the form "{layer-prefix}{n}", e.g. "A001", "S001". */
  id: string;
  layer: AssetLayer;
  /** Localised human-readable name (from the source question option). */
  name: string;
  category: string;
  defaultExposure: Exposure;
  /** Origin: question option that created this, or null for manual entries. */
  source: { questionId: string; optionId: string } | null;
}

/** Classified output structure for export, print, and risk-assessment handoff. */
export interface InformationsverbundOutput {
  geschaeftsprozesse: InventoryAsset[];
  anwendungen: InventoryAsset[];
  itSysteme: InventoryAsset[];
  raeume: InventoryAsset[];
  kommunikationsverbindungen: InventoryAsset[];
}
