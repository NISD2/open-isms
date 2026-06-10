/**
 * NIS2 Asset Type Presets
 *
 * Derived from NIS2 all-hazards scope (Art. 21 + Recital 79)
 * and §30 Abs. 2 Nr. 9 BSIG (OT explicitly in scope).
 *
 * These are presets — `type` is varchar(100) in the DB,
 * so custom values are always allowed via "Other" in the UI.
 */
export const NIS2_ASSET_TYPES = [
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
