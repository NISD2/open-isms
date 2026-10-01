/**
 * The shapes of the Durchgang. An item is one requirement, walked one screen at a time; a screen
 * has one focus.
 *
 * Data only. Every word a screen shows lives in messages/durchgang under the item and the
 * screen's id, parsed by ./copy, so this file holds no copy and one script serves every locale.
 * What a screen asks comes from the category schema: a fields screen names schema keys, typed, so
 * a misspelt field fails `tsc`.
 *
 * Each kind of content is its own kind of screen because it gets its own visual form: the duty
 * is a paragraph with its statute, an example is the artefact itself, a BSI rule is shown as the
 * BSI wrote it.
 */

import type { FunctionalGroup } from "@/lib/asset-inventory/catalog";
import type { Frequency, Impact } from "@/lib/compliance/bsi-200-3";
import type { CategoryCode, CategoryField } from "@/lib/compliance/category-schemas";
import type { AssetSlice, RatingTarget } from "./ratings";

/**
 * A rule shown as it is, read-only, rendered from the module that holds it: the 200-3 matrix
 * (`bsi-200-3.ts`), the § 28 size thresholds (`applicability/classify.ts`), the § 32 reporting
 * deadlines (`bsig-32.ts`), the national registration portals (`data/nis2-registration-portals`).
 */
export type Provision =
  | "bsi_200_3_matrix"
  | "bsig_28_thresholds"
  | "bsig_32_clock"
  | "registration_portals";

/**
 * A register the requirement page shows for the item (its `moduleRef`), which a screen shows as
 * the list itself. The asset register has its own screen kind, because it is offered in slices.
 */
export type RegisterModule = "supplier" | "team" | "training_record";

/** A page a learn screen points to: one of the platform's, or one the BSI publishes. */
export type LearnLink = "ceo_course" | "bsi_it_notfallkarte";

/** A BSI default the person may take over with one click, as an explicit write. */
export type Adoptable = "bsi_200_3_method";

/** A policy the walk writes from its own template; the text is in messages/durchgang. */
export type PolicyTemplate = "information_security" | "incident_response";

/** Where a list the company needs usually exists already. */
export const SOURCE_IDS = [
  "ropa",
  "ledger",
  "provider",
  "payables",
  "contracts",
  "dpa",
  "terms",
] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

export type Screen<C extends CategoryCode> =
  | { readonly kind: "learn"; readonly id: string; readonly link?: LearnLink }
  /** What to have ready before starting, as the law or the BSI lists it. */
  | { readonly kind: "prepare"; readonly id: string }
  /** Example: a good and a bad value side by side. */
  | { readonly kind: "compare"; readonly id: string }
  /** Example: a few lines of what the finished list looks like. */
  | { readonly kind: "sample"; readonly id: string }
  /**
   * Examples read off the 200-3 matrix, from low to high. Each level is computed from its two
   * ratings, never written; the copy gives each example its words, in the same order.
   */
  | {
      readonly kind: "reading";
      readonly id: string;
      readonly examples: ReadonlyArray<{
        readonly frequency: Frequency;
        readonly impact: Impact;
      }>;
    }
  | { readonly kind: "provision"; readonly id: string; readonly provision: Provision }
  | {
      readonly kind: "fields";
      readonly id: string;
      readonly fields: readonly CategoryField<C>[];
      /**
       * The signature page of the policy the item's policy screen wrote: once its answers are
       * saved, that policy is marked approved with the version and the day these two fields hold.
       */
      readonly approves?: {
        readonly version: CategoryField<C>;
        readonly date: CategoryField<C>;
      };
    }
  | {
      readonly kind: "evidence";
      readonly id: string;
      /** The intake field an upload fills with the file's name, where the item has one. */
      readonly field: CategoryField<C> | null;
    }
  | { readonly kind: "adopt"; readonly id: string; readonly adopts: Adoptable }
  | { readonly kind: "register"; readonly id: string; readonly module: RegisterModule }
  | {
      readonly kind: "sources";
      readonly id: string;
      readonly sources: readonly SourceId[];
    }
  /** One slice of the asset catalogue, so no screen is a wall of checkboxes. */
  | {
      readonly kind: "assets";
      readonly id: string;
      readonly groups: readonly FunctionalGroup[];
    }
  /** Which one exactly, and from whom: each listed asset gets its product and its provider. */
  | { readonly kind: "specify"; readonly id: string; readonly slice: AssetSlice }
  /** Each listed asset or supplier rated on the two 200-3 scales, as a risk linked to it. */
  | { readonly kind: "rate"; readonly id: string; readonly targets: RatingTarget }
  /**
   * Each supplier, with its rating beside it: what the contract, the AVV or the provider's terms
   * already settle about security and about reporting incidents.
   */
  | { readonly kind: "agreements"; readonly id: string }
  /**
   * A policy written from our template: fixed sections, optional clauses the person adds, the
   * company's name and the item's answers filled in. Stored as one `policy` row of the item's
   * requirement.
   */
  | { readonly kind: "policy"; readonly id: string; readonly policy: PolicyTemplate }
  | { readonly kind: "done"; readonly id: string };

export type AnyScreen = Screen<CategoryCode>;
export type ScreenKind = AnyScreen["kind"];

type IsoDate = `${number}-${number}-${number}`;

export interface Item<C extends CategoryCode> {
  /** Requirement code in the NIS 2 framework. */
  readonly code: string;
  /** The requirement's category, which types its fields. A test checks it against the framework. */
  readonly category: C;
  /** Keys under `info.glossary.terms`. */
  readonly glossary: readonly string[];
  /**
   * The day the item's copy passed the primary-source fact-check. Required: an item without a
   * checked text is not in the script, and the requirement page keeps it.
   */
  readonly reviewed: IsoDate;
  readonly screens: readonly Screen<C>[];
  /**
   * Intake fields of the item the Durchgang deliberately does not ask, each with the reason. The
   * requirement page keeps asking them; a test fails on any field that is neither asked nor here.
   */
  readonly notAsked?: Readonly<Partial<Record<CategoryField<C>, string>>>;
}

/** Any item, with its screens typed against its own category. */
export type AnyItem = { readonly [C in CategoryCode]: Item<C> }[CategoryCode];

/** The intake fields an item asks for: on its field screens, and the one its upload fills. */
export const askedFields = (item: AnyItem): readonly string[] =>
  item.screens.flatMap<string>((s) =>
    s.kind === "fields" ? s.fields : s.kind === "evidence" && s.field ? [s.field] : [],
  );
