import de from "@/messages/assetInventory/de.json";
import en from "@/messages/assetInventory/en.json";
import { CATALOG } from "./catalog";

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

/** Names compared as a person reads them, so "Datev " and "DATEV" are one. */
export const nameKey = (name: string) => name.trim().toLowerCase();

/**
 * A register read against the catalogue: the items already on it, by id, and the entries that
 * are no catalogue item, by name. The same comparison decides which ticked items are added.
 */
export function onRegister(names: readonly string[]): {
  listed: readonly string[];
  others: readonly string[];
} {
  const taken = new Set(names.map(nameKey));
  const listed = CATALOG.flatMap((item) =>
    catalogNames(item.id).some((n) => taken.has(nameKey(n))) ? [item.id] : [],
  );
  const known = new Set(listed.flatMap((id) => catalogNames(id).map(nameKey)));
  return { listed, others: names.filter((n) => !known.has(nameKey(n))) };
}
