import de from "@/messages/assetInventory/de.json";
import en from "@/messages/assetInventory/en.json";

type Labels = Readonly<Record<string, { readonly label: string }>>;

/** The catalogue's item names in each language an asset can be added in. */
export const CATALOG_LABELS: Readonly<Record<"de" | "en", Labels>> = {
  de: de.assetInventory.catalog,
  en: en.assetInventory.catalog,
};

/**
 * Every name a catalogue item may carry on a company's asset list. An asset added in German stays
 * "Laptops und Desktops" when the person later browses in English, so a lookup tries both.
 */
export const catalogNames = (id: string): readonly string[] =>
  Object.values(CATALOG_LABELS).flatMap((labels) => {
    const label = labels[id]?.label;
    return label ? [label] : [];
  });
