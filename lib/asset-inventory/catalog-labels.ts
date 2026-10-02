import de from "@/messages/assetInventory/de.json";
import en from "@/messages/assetInventory/en.json";
import type { Asset } from "@/schema/types";
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

const ID_BY_NAME: ReadonlyMap<string, string> = new Map(
  CATALOG.flatMap((item) =>
    catalogNames(item.id).map((n) => [nameKey(n), item.id] as const),
  ),
);

/** The catalogue item a text names, in either language. */
export const catalogIdByName = (text: string | null): string | null =>
  text === null ? null : (ID_BY_NAME.get(nameKey(text)) ?? null);

/** A catalogue item's name in one language. */
export const catalogLabel = (id: string | null, locale: "de" | "en"): string | null =>
  id === null ? null : (CATALOG_LABELS[locale][id]?.label ?? null);

type Listed = Readonly<Pick<Asset, "catalogId" | "name" | "description">>;

/**
 * The catalogue item a listed thing is: its `catalog_id`, or for a row written without one, its
 * name, or the catalogue name 2.2 used to move into the description on a rename.
 */
export const catalogIdOf = (asset: Listed): string | null =>
  asset.catalogId ?? catalogIdByName(asset.name) ?? catalogIdByName(asset.description);

/** What the company wrote about a listed thing; a catalogue name left there by 2.2 is not that. */
export const ownDescription = (asset: Pick<Listed, "description">): string | null =>
  catalogIdByName(asset.description) === null ? asset.description?.trim() || null : null;

/** Whether a listed thing is one of the catalogue items a test picks. */
const listedAs = (pick: (item: CatalogItem) => boolean) => {
  const ids: ReadonlySet<string> = new Set(
    CATALOG.flatMap((item) => (pick(item) ? [item.id] : [])),
  );
  return (asset: Listed): boolean => {
    const id = catalogIdOf(asset);
    return id !== null && ids.has(id);
  };
};

/** A catalogue line nobody signs in to, which the second-factor screen leaves out. */
export const noSignIn = listedAs((item) => item.signIn === false);

/** A system that makes the company's backups, which 4.4 records per system. */
export const isBackupSystem = listedAs((item) => item.backup === true);

/**
 * A register read against the catalogue: the items already on it, by id, also once 2.2 renamed
 * them to the product, and the entries that are no catalogue item, by name. addAssets skips an
 * item by the same reading.
 */
export function onRegister(assets: readonly Listed[]): {
  listed: readonly string[];
  others: readonly string[];
} {
  const read = assets.map((a) => ({ id: catalogIdOf(a), name: a.name }));
  return {
    listed: [...new Set(read.flatMap((a) => (a.id === null ? [] : [a.id])))],
    others: read.flatMap((a) => (a.id === null ? [a.name] : [])),
  };
}
