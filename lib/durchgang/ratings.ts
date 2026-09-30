/**
 * How the Durchgang names and rates what the company listed. Each asset and each supplier gets one
 * rating on the two scales of BSI 200-3, stored as a `risk` row linked to it. The screens and the
 * router read the same rules here, so the rows a screen shows and the rows the server writes
 * cannot disagree.
 */

import {
  FREQUENCIES,
  type Frequency,
  IMPACTS,
  type Impact,
  RISK_LEVELS,
  type RiskLevel,
  riskLevel,
} from "@/lib/compliance/bsi-200-3";
import type { NoteLocale } from "./notes";

/** What the company runs as software and services, or the technology and rooms under it. */
export type AssetSlice = "software" | "technology";
export type RatingTarget = AssetSlice | "suppliers";

const SOFTWARE: ReadonlySet<string> = new Set([
  "application",
  "cloud_service",
  "database",
  "data_store",
]);

/**
 * The screen an asset appears on, by its type. Business processes appear on neither: the walk
 * names and rates the things a company uses, and a process is something it does.
 */
export const sliceOf = (type: string): AssetSlice | null =>
  type === "process" ? null : SOFTWARE.has(type) ? "software" : "technology";

export interface Rating {
  readonly frequency: Frequency;
  readonly impact: Impact;
}

export const levelOf = (rating: Rating): RiskLevel =>
  riskLevel(rating.frequency, rating.impact);

/** A rating as a `risk` row stores it: each scale's step counted from 1, as the method numbers them. */
export const toScale = (rating: Rating) => ({
  likelihood: FREQUENCIES.indexOf(rating.frequency) + 1,
  impact: IMPACTS.indexOf(rating.impact) + 1,
});

/** A stored row read back on the 200-3 scales; null when its values lie outside them. */
export const fromScale = (likelihood: number, impact: number): Rating | null => {
  const frequency = FREQUENCIES[likelihood - 1];
  const damage = IMPACTS[impact - 1];
  return frequency && damage ? { frequency, impact: damage } : null;
};

/**
 * What a listed thing already has in the risk register, which decides what its row may do.
 * `open`: nothing yet, and a rating adds one risk. `rated`: exactly one risk on the 200-3 scales,
 * which the row shows and edits. `kept`: several risks, or one on another scale; those are worked
 * on in the risk register, so the walk shows them and writes nothing.
 */
export type Standing =
  | { readonly kind: "open" }
  | { readonly kind: "rated"; readonly riskId: string; readonly rating: Rating }
  | { readonly kind: "kept"; readonly count: number; readonly highest: RiskLevel | null };

export interface StoredRisk {
  readonly id: string;
  readonly likelihood: number;
  readonly impact: number;
}

const highestOf = (levels: readonly RiskLevel[]): RiskLevel | null =>
  levels.reduce<RiskLevel | null>(
    (top, level) =>
      top === null || RISK_LEVELS.indexOf(level) > RISK_LEVELS.indexOf(top) ? level : top,
    null,
  );

export const standingOf = (risks: readonly StoredRisk[]): Standing => {
  const [only, ...rest] = risks;
  if (!only) return { kind: "open" };
  const rating = fromScale(only.likelihood, only.impact);
  if (rest.length === 0 && rating) return { kind: "rated", riskId: only.id, rating };
  return {
    kind: "kept",
    count: risks.length,
    highest: highestOf(
      risks.flatMap((r) => {
        const read = fromScale(r.likelihood, r.impact);
        return read ? [levelOf(read)] : [];
      }),
    ),
  };
};

/**
 * The treatment a new rating is written with. BSI 200-3 (Tabelle 10) calls it common practice to
 * accept low risks and keep watching them; anything higher is marked for measures. The acceptance
 * itself stays empty, because management gives it.
 */
export const treatmentFor = (level: RiskLevel): "accept" | "mitigate" =>
  level === "low" ? "accept" : "mitigate";

/** The supplier register's own level for a rating; its top step is called critical. */
export const SUPPLIER_LEVEL = {
  low: "low",
  medium: "medium",
  high: "high",
  very_high: "critical",
} as const satisfies Record<RiskLevel, "low" | "medium" | "high" | "critical">;

const TEXT = {
  de: {
    asset: (name: string) => ({
      title: `${name}: Ausfall, Angriff oder Datenverlust`,
      description: `Der schlimmste realistische Fall für ${name}: Ausfall, Angriff oder Datenverlust. Bewertet nach BSI-Standard 200-3.`,
    }),
    supplier: (name: string) => ({
      title: `${name}: Ausfall oder Sicherheitsvorfall beim Lieferanten`,
      description: `Der schlimmste realistische Fall bei ${name}: Der Lieferant fällt aus oder hat einen Sicherheitsvorfall. Bewertet nach BSI-Standard 200-3.`,
    }),
  },
  en: {
    asset: (name: string) => ({
      title: `${name}: outage, attack or data loss`,
      description: `The worst realistic case for ${name}: outage, attack or data loss. Rated on the scales of BSI Standard 200-3.`,
    }),
    supplier: (name: string) => ({
      title: `${name}: outage or security incident at the supplier`,
      description: `The worst realistic case at ${name}: the supplier fails or has a security incident. Rated on the scales of BSI Standard 200-3.`,
    }),
  },
} as const;

/** The title and description of the risk a rating adds, in the record language. */
export const ratingText = (
  locale: NoteLocale,
  kind: "asset" | "supplier",
  name: string,
): { readonly title: string; readonly description: string } => TEXT[locale][kind](name);

interface ListedAsset {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly supplierId: string | null;
}

interface ListedSupplier {
  readonly id: string;
  readonly name: string;
}

/** A risk with the ids of what it is linked to. */
export interface LinkedRisk extends StoredRisk {
  readonly linked: readonly string[];
}

export type RatingRow =
  | {
      readonly kind: "asset";
      readonly key: string;
      readonly id: string;
      readonly name: string;
      readonly provider: string | null;
      readonly standing: Standing;
    }
  | {
      readonly kind: "supplier";
      readonly key: string;
      readonly id: string;
      readonly name: string;
      readonly provides: readonly string[];
      readonly standing: Standing;
    };

export const ratingKey = (kind: "asset" | "supplier", id: string): string =>
  `${kind}:${id}`;

const linkedTo = (risks: readonly LinkedRisk[], id: string) =>
  risks.filter((r) => r.linked.includes(id));

/** The rows of one rating screen, each with who provides it or what it provides. */
export function ratingRows(
  target: RatingTarget,
  lists: {
    readonly assets: readonly ListedAsset[];
    readonly suppliers: readonly ListedSupplier[];
    readonly assetRisks: readonly LinkedRisk[];
    readonly supplierRisks: readonly LinkedRisk[];
  },
): readonly RatingRow[] {
  if (target === "suppliers") {
    return lists.suppliers.map((s) => ({
      kind: "supplier",
      key: ratingKey("supplier", s.id),
      id: s.id,
      name: s.name,
      provides: lists.assets.filter((a) => a.supplierId === s.id).map((a) => a.name),
      standing: standingOf(linkedTo(lists.supplierRisks, s.id)),
    }));
  }
  const names = new Map(lists.suppliers.map((s) => [s.id, s.name]));
  return lists.assets
    .filter((a) => sliceOf(a.type) === target)
    .map((a) => ({
      kind: "asset",
      key: ratingKey("asset", a.id),
      id: a.id,
      name: a.name,
      provider: a.supplierId ? (names.get(a.supplierId) ?? null) : null,
      standing: standingOf(linkedTo(lists.assetRisks, a.id)),
    }));
}
