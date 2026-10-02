import de from "@/messages/assetInventory/de.json";
import en from "@/messages/assetInventory/en.json";
import { CATALOG, type CatalogItem } from "./catalog";

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

const CATALOG_NAMES: ReadonlySet<string> = new Set(
  CATALOG.flatMap((item) => catalogNames(item.id).map(nameKey)),
);

/** Whether a text is a catalogue item's name, in either language. */
export const isCatalogName = (text: string | null): text is string =>
  text !== null && CATALOG_NAMES.has(nameKey(text));

interface Listed {
  readonly name: string;
  readonly description: string | null;
}

/**
 * Whether a listed thing is one of the catalogue items a test picks, read off its name or, once
 * 2.2 renamed it, the catalogue name kept in its description.
 */
const listedAs = (pick: (item: CatalogItem) => boolean) => {
  const names: ReadonlySet<string> = new Set(
    CATALOG.flatMap((item) => (pick(item) ? catalogNames(item.id).map(nameKey) : [])),
  );
  return (asset: Listed): boolean =>
    [asset.name, asset.description].some((n) => n !== null && names.has(nameKey(n)));
};

/** A catalogue line nobody signs in to, which the second-factor screen leaves out. */
export const noSignIn = listedAs((item) => item.signIn === false);

/** A system that makes the company's backups, which 4.4 records per system. */
export const isBackupSystem = listedAs((item) => item.backup === true);

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
