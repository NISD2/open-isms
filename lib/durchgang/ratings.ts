/**
 * How the Durchgang names and rates what the company listed. Each asset and each supplier gets one
 * rating on the two scales of BSI 200-3, stored as a `risk` row linked to it. The screens and the
 * router read the same rules here, so the rows a screen shows and the rows the server writes
 * cannot disagree.
 */

import type { supplierRiskLevelEnum } from "@nisd2/grc-data-model/enums";
import type { z } from "zod";
import {
  catalogIdOf,
  noSignIn,
  ownDescription,
} from "@/lib/asset-inventory/catalog-labels";
import type { AssetType } from "@/lib/compliance/asset-types";
import {
  FREQUENCIES,
  type Frequency,
  IMPACTS,
  type Impact,
  RISK_LEVELS,
  type RiskLevel,
  riskLevel,
} from "@/lib/compliance/bsi-200-3";
import type { Asset, AssetProvider, Risk, Supplier } from "@/schema/types";
import type { riskInsertSchema } from "@/schema/validators";
import type { Hosting, WalkLocale } from "./types";

/** A risk's treatment, as the risk register's validator allows it. */
type Treatment = z.infer<typeof riskInsertSchema>["treatment"];

/** A supplier's level, as the database enum `supplier_risk_level` holds it. */
type SupplierLevel = (typeof supplierRiskLevelEnum.enumValues)[number];

/** What the company runs as software and services, or the technology and rooms under it. */
export type AssetSlice = "software" | "technology";
export type RatingTarget = AssetSlice | "suppliers";

const SOFTWARE: ReadonlySet<string> = new Set([
  "application",
  "cloud_service",
  "database",
  "data_store",
] satisfies AssetType[]);

/**
 * The screen an asset appears on, by its type. Business processes appear on neither: the walk
 * names and rates the things a company uses, and a process is something it does.
 */
export const sliceOf = (type: string): AssetSlice | null =>
  type === "process" ? null : SOFTWARE.has(type) ? "software" : "technology";

/**
 * Whether 2.2 asks where an asset of this type runs, in house or in the cloud: software and
 * services, and the servers they run on. A device, a room or a line runs nowhere else.
 */
export const asksHosting = (type: string): boolean =>
  SOFTWARE.has(type) || type === "server";

/** Where an asset runs as 2.2 shows it: the answer, else the cloud for what is a cloud service. */
export const hostingOf = (asset: {
  readonly type: string;
  readonly hosting: Hosting | null;
}): Hosting | null => asset.hosting ?? (asset.type === "cloud_service" ? "cloud" : null);

/**
 * Whether people sign in to an asset of this type: software and services, and the network, which
 * holds the remote access. Devices, rooms and machines are left out, because a second factor
 * guards an account, and the accounts people sign in with live in the software and the remote
 * access.
 */
export const signsIn = (type: string): boolean =>
  SOFTWARE.has(type) || type === "network";

/** A thing the second-factor screen (11.1) asks about: of a kind people sign in to, and not a catalogue line nobody does. */
export const asksSecondFactor = (
  asset: Readonly<{
    type: string;
    catalogId: string | null;
    name: string;
    description: string | null;
  }>,
): boolean => signsIn(asset.type) && !noSignIn(asset);

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
  | {
      readonly kind: "rated";
      readonly riskId: string;
      readonly rating: Rating;
      /** The person's own line on the risk, kept as its treatment description. */
      readonly note: string;
    }
  | { readonly kind: "kept"; readonly count: number; readonly highest: RiskLevel | null };

/** A risk as a rating reads it; the note is its treatment description. */
export type StoredRisk = Readonly<Pick<Risk, "id" | "likelihood" | "impact">> & {
  readonly note?: string | null;
};

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
  if (rest.length === 0 && rating) {
    return { kind: "rated", riskId: only.id, rating, note: only.note ?? "" };
  }
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

/** The level a listed thing stands at: its one rating, the highest of several, or none yet. */
export const levelOfStanding = (standing: Standing): RiskLevel | null =>
  standing.kind === "rated"
    ? levelOf(standing.rating)
    : standing.kind === "kept"
      ? standing.highest
      : null;

/** Orders rows highest level first, where a gap matters most; unrated rows last. */
export const byLevel = (
  a: { readonly level: RiskLevel | null },
  b: { readonly level: RiskLevel | null },
): number => {
  const rank = (level: RiskLevel | null) => (level ? RISK_LEVELS.indexOf(level) : -1);
  return rank(b.level) - rank(a.level);
};

/**
 * A listed thing as the risk map shows it: its one rating, which places it in a cell, and its
 * level. A thing with several risks has a level but no single cell.
 */
export interface MappedRisk {
  /** The rating row's key, so a name or a cell on the map opens that row to re-rate. */
  readonly key: string;
  readonly name: string;
  readonly rating: Rating | null;
  readonly level: RiskLevel | null;
}

/** The company's risks that sit in one cell of the matrix. */
export const inCell = (
  risks: readonly MappedRisk[],
  frequency: Frequency,
  impact: Impact,
): readonly MappedRisk[] =>
  risks.filter((r) => r.rating?.frequency === frequency && r.rating.impact === impact);

/** How many of the company's risks sit in one cell of the matrix. */
export const cellCount = (
  risks: readonly MappedRisk[],
  frequency: Frequency,
  impact: Impact,
): number => inCell(risks, frequency, impact).length;

/** The rated things by level, highest first, leaving out levels nothing sits at. */
export const levelGroups = (
  risks: readonly MappedRisk[],
): ReadonlyArray<{ readonly level: RiskLevel; readonly risks: readonly MappedRisk[] }> =>
  [...RISK_LEVELS].reverse().flatMap((level) => {
    const at = risks.filter((r) => r.level === level);
    return at.length > 0 ? [{ level, risks: at }] : [];
  });

/**
 * The treatment a new rating is written with. BSI 200-3 (Tabelle 10) calls it common practice to
 * accept low risks and keep watching them; anything higher is marked for measures. The acceptance
 * itself stays empty, because management gives it.
 */
export const treatmentFor = (level: RiskLevel): Treatment =>
  level === "low" ? "accept" : "mitigate";

/** The supplier register's own level for a rating; its top step is called critical. */
export const SUPPLIER_LEVEL = {
  low: "low",
  medium: "medium",
  high: "high",
  very_high: "critical",
} as const satisfies Record<RiskLevel, SupplierLevel>;

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

/** What a rating screen rates: the company's assets, or its suppliers. */
export const RATED_KINDS = ["asset", "supplier"] as const;
export type RatedKind = (typeof RATED_KINDS)[number];

/** The title and description of the risk a rating adds, in the record language. */
export const ratingText = (
  locale: WalkLocale,
  kind: RatedKind,
  name: string,
): { readonly title: string; readonly description: string } => TEXT[locale][kind](name);

type ListedAsset = Readonly<
  Pick<Asset, "id" | "catalogId" | "name" | "type" | "description">
>;

type ListedSupplier = Readonly<Pick<Supplier, "id" | "name">>;

/** One supplier that provides one asset (`asset_provider`); an asset can have several. */
export type ProviderLink = Readonly<Pick<AssetProvider, "assetId" | "supplierId">>;

/** The names of an asset's providers, in the order of the supplier list. */
export const providersOf = (
  assetId: string,
  links: readonly ProviderLink[],
  suppliers: readonly ListedSupplier[],
): readonly string[] => {
  const linked = new Set(
    links.flatMap((l) => (l.assetId === assetId ? [l.supplierId] : [])),
  );
  return suppliers.flatMap((s) => (linked.has(s.id) ? [s.name] : []));
};

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
      /** What the company wrote it is for, in 2.2. */
      readonly about: string | null;
      /** The catalogue item it was listed as, which says what kind of thing it is. */
      readonly catalogId: string | null;
      readonly providers: readonly string[];
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

export const ratingKey = (kind: RatedKind, id: string): string => `${kind}:${id}`;

const linkedTo = (risks: readonly LinkedRisk[], id: string) =>
  risks.filter((r) => r.linked.includes(id));

/** Systems a company brings back after an outage: software and services, servers, the network. */
const restores = (type: string): boolean =>
  SOFTWARE.has(type) || type === "server" || type === "network";

/**
 * The systems in the order to bring them back, read off their 2.3 ratings: the largest damage
 * first, then the more frequent, then by name. A system not rated with one 200-3 rating comes
 * last, by name.
 */
export const recoveryOrder = (
  assets: ReadonlyArray<Pick<ListedAsset, "id" | "name" | "type">>,
  risks: readonly LinkedRisk[],
): readonly string[] =>
  assets
    .filter((a) => restores(a.type))
    .map((a) => {
      const standing = standingOf(linkedTo(risks, a.id));
      const rated = standing.kind === "rated" ? standing.rating : null;
      return {
        name: a.name,
        impact: rated ? IMPACTS.indexOf(rated.impact) : -1,
        frequency: rated ? FREQUENCIES.indexOf(rated.frequency) : -1,
      };
    })
    .sort(
      (a, b) =>
        b.impact - a.impact || b.frequency - a.frequency || a.name.localeCompare(b.name),
    )
    .map((a) => a.name);

/** The rows of one rating screen, each with who provides it or what it provides. */
export function ratingRows(
  target: RatingTarget,
  lists: {
    readonly assets: readonly ListedAsset[];
    readonly suppliers: readonly ListedSupplier[];
    readonly links: readonly ProviderLink[];
    readonly assetRisks: readonly LinkedRisk[];
    readonly supplierRisks: readonly LinkedRisk[];
  },
): readonly RatingRow[] {
  if (target === "suppliers") {
    return lists.suppliers.map((s) => {
      const provided = new Set(
        lists.links.flatMap((l) => (l.supplierId === s.id ? [l.assetId] : [])),
      );
      return {
        kind: "supplier",
        key: ratingKey("supplier", s.id),
        id: s.id,
        name: s.name,
        provides: lists.assets.filter((a) => provided.has(a.id)).map((a) => a.name),
        standing: standingOf(linkedTo(lists.supplierRisks, s.id)),
      };
    });
  }
  return lists.assets
    .filter((a) => sliceOf(a.type) === target)
    .map((a) => ({
      kind: "asset",
      key: ratingKey("asset", a.id),
      id: a.id,
      name: a.name,
      about: ownDescription(a),
      catalogId: catalogIdOf(a),
      providers: providersOf(a.id, lists.links, lists.suppliers),
      standing: standingOf(linkedTo(lists.assetRisks, a.id)),
    }));
}
