import { describe, expect, test } from "bun:test";
import grcVendorsRaw from "@/data/grc-vendors.json";
import { czechVendorText, localiseDataset, vendorText } from "./localize";
import { loadVendorDataset } from "./schema";

const { vendors } = loadVendorDataset(grcVendorsRaw);

describe("the Czech vendor texts", () => {
  test("every vendor has its Czech price model, and its export evidence where it has one", () => {
    const missing = vendors.flatMap((vendor) => {
      const czech = czechVendorText[vendor.id];
      if (czech === undefined) return [vendor.id];
      return vendor.dataExportEvidence && czech.dataExportEvidence === undefined
        ? [`${vendor.id} evidence`]
        : [];
    });
    expect(missing).toEqual([]);
  });

  test("hold no vendor the dataset does not have", () => {
    const ids = new Set(vendors.map((vendor) => vendor.id));
    expect(Object.keys(czechVendorText).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe("vendorText", () => {
  const vendor = vendors[0];
  if (vendor === undefined) throw new Error("no vendors");

  test("German, English, and English for a language without its own text", () => {
    expect(vendorText(vendor, "de").priceModel).toBe(vendor.priceModel.de);
    expect(vendorText(vendor, "en").priceModel).toBe(vendor.priceModel.en);
    expect(vendorText(vendor, "nl").priceModel).toBe(vendor.priceModel.en);
  });

  test("Czech readers get the Czech text", () => {
    expect(vendorText(vendor, "cs").priceModel).toBe(
      czechVendorText[vendor.id]?.priceModel ?? "",
    );
  });
});

describe("localiseDataset", () => {
  test("hands the page each vendor in one language and leaves the rest of the row alone", () => {
    const dataset = loadVendorDataset(grcVendorsRaw);
    const german = localiseDataset(dataset, "de");
    expect(german.vendors.length).toBe(dataset.vendors.length);
    german.vendors.forEach((localised, i) => {
      const source = dataset.vendors[i];
      expect(localised.id).toBe(source?.id ?? "");
      expect(localised.priceModel).toBe(source?.priceModel.de ?? "");
    });
  });
});
