import { toCsv } from "@/lib/csv";
import type { InformationsverbundOutput, InventoryAsset } from "./types";

// CSV export. Format: standard RFC 4180 (commas, double-quote escaping,
// CRLF line endings). Header row matches the BSI §8.1.6 attribute table
// so the auditor sees a familiar shape.
//
// Columns: id, name, layer, category, defaultExposure, source
// (source = "catalog:<id>" or "custom")

const HEADER = ["id", "name", "layer", "category", "exposure", "source"] as const;

function rowOf(asset: InventoryAsset): string[] {
  const source = asset.source ? `catalog:${asset.source.optionId}` : "custom";
  return [
    asset.id,
    asset.name,
    asset.layer,
    asset.category,
    asset.defaultExposure,
    source,
  ];
}

export function outputToCsv(output: InformationsverbundOutput): string {
  const all = [
    ...output.geschaeftsprozesse,
    ...output.anwendungen,
    ...output.itSysteme,
    ...output.raeume,
    ...output.kommunikationsverbindungen,
  ];
  return toCsv([HEADER, ...all.map(rowOf)]);
}

/** Trigger a browser download for the given CSV content. */
export function downloadCsv(content: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
