import { z } from "zod";

export const vendorTierEnum = z.enum(["transparent", "partial", "gated", "unverifiable"]);
export type VendorTier = z.infer<typeof vendorTierEnum>;

export const vendorCategoryEnum = z.enum([
  "isms",
  "grc",
  "tprm",
  "consultancy",
  "audit",
  "ratings",
  "template",
  "ai-grc",
  "endpoint",
  "vuln",
  "cspm",
  "iam",
  "training",
  "asset",
  "reporting",
  "comms",
]);
export type VendorCategory = z.infer<typeof vendorCategoryEnum>;

export const vendorFreeTierEnum = z.enum(["none", "trial", "freemium", "oss"]);
export type VendorFreeTier = z.infer<typeof vendorFreeTierEnum>;

export const vendorFormLikenessEnum = z.enum(["low", "medium", "high"]);
export type VendorFormLikeness = z.infer<typeof vendorFormLikenessEnum>;

export const vendorDataExportEnum = z.enum([
  "full-open",
  "documented-partial",
  "report-only",
  "none-documented",
]);
export type VendorDataExport = z.infer<typeof vendorDataExportEnum>;

const localizedString = z.object({
  de: z.string(),
  en: z.string(),
});

export const vendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  tier: vendorTierEnum,
  category: vendorCategoryEnum,
  entryPriceEur: z.number().nullable(),
  priceModel: localizedString,
  nis2Listed: z.boolean(),
  frameworks: z.array(z.string()),
  freeTier: vendorFreeTierEnum,
  formLikeness: vendorFormLikenessEnum,
  sourceUrl: z.string().url(),
  notes: localizedString.nullable(),
  lastVerified: z.string(),
  dataExport: vendorDataExportEnum.nullable().optional(),
  dataExportEvidence: localizedString.nullable().optional(),
});
export type Vendor = z.infer<typeof vendorSchema>;

export const vendorDatasetSchema = z.object({
  lastUpdated: z.string(),
  methodology: localizedString,
  vendors: z.array(vendorSchema),
});
export type VendorDataset = z.infer<typeof vendorDatasetSchema>;

export function loadVendorDataset(raw: unknown): VendorDataset {
  return vendorDatasetSchema.parse(raw);
}

export function summarise(dataset: VendorDataset) {
  const v = dataset.vendors;
  return {
    total: v.length,
    transparent: v.filter((x) => x.tier === "transparent").length,
    partial: v.filter((x) => x.tier === "partial").length,
    gated: v.filter((x) => x.tier === "gated").length,
    unverifiable: v.filter((x) => x.tier === "unverifiable").length,
    nis2Listed: v.filter((x) => x.nis2Listed).length,
    withFreeTier: v.filter((x) => x.freeTier !== "none").length,
    oss: v.filter((x) => x.freeTier === "oss").length,
    countries: new Set(v.map((x) => x.country)).size,
    dataExportFullOpen: v.filter((x) => x.dataExport === "full-open").length,
    dataExportPartial: v.filter((x) => x.dataExport === "documented-partial").length,
    dataExportReportOnly: v.filter((x) => x.dataExport === "report-only").length,
    dataExportNone: v.filter((x) => x.dataExport === "none-documented").length,
    dataExportResearched: v.filter((x) => x.dataExport != null).length,
  };
}
