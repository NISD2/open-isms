import type { AssetLayer } from "@/lib/asset-inventory/types";
import type { RiskLevel } from "@/lib/compliance/bsi-200-3";
import type { SourceId } from "@/lib/durchgang";

/** What the person has entered on this item so far, kept while they move between its screens. */
export interface Draft {
  /** Intake field values, as the inputs hold them. */
  readonly values: Readonly<Record<string, unknown>>;
  readonly sources: readonly SourceId[];
  readonly acceptance: RiskLevel | null;
  /** Ticked catalogue items on the asset screens. */
  readonly checked: readonly string[];
  readonly custom: ReadonlyArray<{ name: string; layer: AssetLayer }>;
  readonly uploaded: string | null;
}

export type DraftUpdate = (next: Draft) => void;
