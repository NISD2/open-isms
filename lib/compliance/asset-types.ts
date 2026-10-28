/**
 * NIS2 Asset Type Presets
 *
 * Derived from NIS2 all-hazards scope (Art. 21 + Recital 79)
 * and §30 Abs. 2 Nr. 9 BSIG ("Verwaltung von IKT-Systemen, -Produkten und -Prozessen"; OT
 * explicitly in scope). A business process comes first: the catalogue lists the company's
 * processes before the things they run on, and the walk's 4.2 asks about them.
 *
 * These are presets — `type` is varchar(100) in the DB,
 * so custom values are always allowed via "Other" in the UI.
 */
export const NIS2_ASSET_TYPES = [
  "process",
  "application",
  "server",
  "endpoint",
  "network",
  "database",
  "cloud_service",
  "data_store",
  "ot_ics",
  "iot",
  "physical",
] as const;

export type NIS2AssetType = (typeof NIS2_ASSET_TYPES)[number];

/** Every type the platform writes itself: the presets, and the catalogue's rooms. */
export type AssetType = NIS2AssetType | "room";
