import { CATALOG_BY_ID } from "./catalog";
import type {
  AssetLayer,
  InformationsverbundOutput,
  InventoryAsset,
} from "./types";

// BSI-200-2 §8.1 — turn the catalog selection into the structured
// Informationsverbund (the five-layer output an auditor expects).
//
// One checked catalog item = one asset entry. One custom asset (free-text
// added by the user) = one entry in its declared layer.
//
// Gruppenbildung principle applies: "all employee notebooks" is meant to be
// counted as 1 asset (the catalog already collapses to that level).

const ID_PREFIX: Record<AssetLayer, string> = {
  geschaeftsprozess: "P",
  anwendung: "A",
  "it-system": "S",
  raum: "R",
  kommunikation: "N",
};

interface ResolveOpts {
  /** i18n-aware name resolver for catalog items (catalog.<id>.label). */
  resolveCatalogName: (catalogId: string) => string;
}

function nextId(
  layer: AssetLayer,
  counters: Record<AssetLayer, number>,
): string {
  counters[layer]++;
  return `${ID_PREFIX[layer]}${String(counters[layer]).padStart(3, "0")}`;
}

export function classifyChecklist(
  checked: string[],
  custom: Array<{ name: string; layer: AssetLayer }>,
  opts: ResolveOpts,
): InformationsverbundOutput {
  const counters: Record<AssetLayer, number> = {
    geschaeftsprozess: 0,
    anwendung: 0,
    "it-system": 0,
    raum: 0,
    kommunikation: 0,
  };

  const all: InventoryAsset[] = [];

  for (const catalogId of checked) {
    const item = CATALOG_BY_ID.get(catalogId);
    if (!item) continue;
    all.push({
      id: nextId(item.layer, counters),
      layer: item.layer,
      name: opts.resolveCatalogName(catalogId),
      category: item.category,
      defaultExposure: item.defaultExposure,
      source: { questionId: "catalog", optionId: catalogId },
    });
  }

  for (const c of custom) {
    all.push({
      id: nextId(c.layer, counters),
      layer: c.layer,
      name: c.name,
      category:
        c.layer === "geschaeftsprozess"
          ? "process"
          : c.layer === "raum"
            ? "room"
            : "application",
      defaultExposure: "internal",
      source: null,
    });
  }

  return {
    geschaeftsprozesse: all.filter((a) => a.layer === "geschaeftsprozess"),
    anwendungen: all.filter((a) => a.layer === "anwendung"),
    itSysteme: all.filter((a) => a.layer === "it-system"),
    raeume: all.filter((a) => a.layer === "raum"),
    kommunikationsverbindungen: all.filter((a) => a.layer === "kommunikation"),
  };
}

export function countAssets(output: InformationsverbundOutput): number {
  return (
    output.geschaeftsprozesse.length +
    output.anwendungen.length +
    output.itSysteme.length +
    output.raeume.length +
    output.kommunikationsverbindungen.length
  );
}
