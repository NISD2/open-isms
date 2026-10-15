import { z } from "zod";
import czechRaw from "@/data/grc-vendors-cs.json";
import { pickLocalized } from "@/lib/locale";
import type { Vendor, VendorDataset } from "./schema";

const CzechVendorsSchema = z.object({
  vendors: z.record(
    z.string(),
    z.object({
      priceModel: z.string().min(1),
      dataExportEvidence: z.string().min(1).optional(),
    }),
  ),
});

/** The Czech price model and export evidence of each vendor, by its id. */
export const czechVendorText = CzechVendorsSchema.parse(czechRaw).vendors;

interface VendorText {
  readonly priceModel: string;
  readonly dataExportEvidence: string | undefined;
}

const english = (vendor: Vendor): VendorText => ({
  priceModel: vendor.priceModel.en,
  dataExportEvidence: vendor.dataExportEvidence?.en,
});

const TEXT_BY_LOCALE = {
  de: (vendor: Vendor): VendorText => ({
    priceModel: vendor.priceModel.de,
    dataExportEvidence: vendor.dataExportEvidence?.de,
  }),
  en: english,
  /** English only for a vendor still missing its Czech text; the vendors test fails on one. */
  cs: (vendor: Vendor): VendorText => {
    const czech = czechVendorText[vendor.id];
    return czech === undefined
      ? english(vendor)
      : { priceModel: czech.priceModel, dataExportEvidence: czech.dataExportEvidence };
  },
};

/** A vendor's price model and export evidence in the reader's language: German, Czech, else English. */
export const vendorText = (vendor: Vendor, locale: string): VendorText =>
  pickLocalized(TEXT_BY_LOCALE, locale)(vendor);

/** A vendor with its words in one language, as the comparison table shows it. */
export type LocalisedVendor = Omit<Vendor, keyof VendorText> & VendorText;

export type LocalisedVendorDataset = Omit<VendorDataset, "vendors"> & {
  readonly vendors: readonly LocalisedVendor[];
};

/**
 * The dataset in one language, built on the server so the browser gets only the words it shows
 * and never loads the Czech file.
 */
export const localiseDataset = (
  dataset: VendorDataset,
  locale: string,
): LocalisedVendorDataset => ({
  ...dataset,
  vendors: dataset.vendors.map((vendor) => ({
    ...vendor,
    ...vendorText(vendor, locale),
  })),
});
