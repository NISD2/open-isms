import type { NIS2Sector } from "./types";

// NIS2 Directive (EU) 2022/2555 Annex I + Annex II — 18 sectors total.
// Verbatim names live in messages/assetInventory/{de,en,nl}.json under
// "sectors.<id>.name" and "sectors.<id>.subsectors".
//
// Primary sources verified June 2026:
//   - EUR-Lex 2022/2555 Annex I + II
//   - BSIG Anlage 1 + Anlage 2 (gesetze-im-internet.de)
//   - CIR (EU) 2024/2690 for the 11 specific entity types
//
// Public administration (Annex I §10) is excluded from this list: in
// Germany it's handled via §28 (out of scope for private-sector
// inventory) and §29 BSIG (federal admin Grundschutz-binding). Surface
// only if/when the tool is used by a public-admin operator.

export const NIS2_SECTORS: NIS2Sector[] = [
  // ─── Annex I — High criticality (essential entities) ────────────
  { id: "energy", annex: "I", regime: "essential" },
  { id: "transport", annex: "I", regime: "essential" },
  { id: "banking", annex: "I", regime: "essential" },
  { id: "financial-market-infrastructure", annex: "I", regime: "essential" },
  { id: "health", annex: "I", regime: "essential" },
  { id: "drinking-water", annex: "I", regime: "essential" },
  { id: "waste-water", annex: "I", regime: "essential" },
  { id: "digital-infrastructure", annex: "I", regime: "essential" },
  { id: "ict-service-management", annex: "I", regime: "essential" },
  { id: "space", annex: "I", regime: "essential" },

  // ─── Annex II — Other critical (important entities) ─────────────
  { id: "postal-courier", annex: "II", regime: "important" },
  { id: "waste-management", annex: "II", regime: "important" },
  { id: "chemicals", annex: "II", regime: "important" },
  { id: "food", annex: "II", regime: "important" },
  { id: "manufacturing", annex: "II", regime: "important" },
  { id: "digital-providers", annex: "II", regime: "important" },
  { id: "research", annex: "II", regime: "important" },
];

export const SECTOR_BY_ID = new Map(NIS2_SECTORS.map((s) => [s.id, s]));

export const ANNEX_I_SECTORS = NIS2_SECTORS.filter((s) => s.annex === "I");
export const ANNEX_II_SECTORS = NIS2_SECTORS.filter((s) => s.annex === "II");
