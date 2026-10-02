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
import {
  BCP_SCHEMA,
  type CategoryCode,
  type CategoryField,
} from "@/lib/compliance/category-schemas";
import type { RoleKey } from "@/lib/compliance/role-keys";
import type { AssetSlice, RatingTarget } from "./ratings";

/**
 * A rule shown as it is, read-only, rendered from the module that holds it: the 200-3 matrix
 * (`bsi-200-3.ts`), the § 28 size thresholds (`applicability/classify.ts`), the § 32 reporting
 * deadlines (`bsig-32.ts`), the national registration portals and the authorities incidents are
 * reported to (`data/nis2-registration-portals`).
 */
export type Provision =
  | "bsi_200_3_matrix"
  | "bsig_28_thresholds"
  | "bsig_32_clock"
  | "registration_portals"
  | "reporting_channels";

/**
 * A register the requirement page shows for the item (its `moduleRef`), which a screen shows as
 * the list itself. The asset register has its own screen kind, because it is offered in slices.
 */
export type RegisterModule = "supplier" | "training_record" | "management_review";

/**
 * Whose trainings a training screen lists and adds: management's, which § 38 Abs. 3 BSIG asks
 * for, or the rest of the staff's, which § 30 Abs. 2 Nr. 7 asks for. One register holds both.
 */
export type TrainingAudience = "management" | "staff";

/** A page a learn screen points to: one of the platform's, or one the BSI publishes. */
export type LearnLink =
  | "ceo_course"
  | "bsi_it_notfallkarte"
  | "bsi_tr_02102"
  | "bsi_nis2_schulungen";

/**
 * The compliance role that stands for management, which approves the documents the walk writes
 * (Art. 20(1) NIS 2, § 38 Abs. 1 BSIG). The requirement sign-off reads the same role.
 */
export const MANAGEMENT_ROLE = "ceo" as const satisfies RoleKey;

/** A BSI default the person may take over with one click, as an explicit write. */
export type Adoptable = "bsi_200_3_method";

/** Where a field's common answers are read from: the software list, or the contact email. */
export type SuggestSource = "software" | "contact";

/**
 * The kinds of second factor 11.1 tells apart per program, stored in `asset.mfa_method`. Signing
 * in through the company's own account (Microsoft, Google) takes whatever factor that account has.
 */
export const MFA_METHODS = [
  "app",
  "security_key",
  "company_account",
  "sms",
  "email",
] as const;
export type MfaMethod = (typeof MFA_METHODS)[number];

/** How often a backup system backs up: the values the intake already offers for 4.4. */
export const BACKUP_FREQUENCIES = BCP_SCHEMA.shape.backupFrequency.options;
export type BackupFrequency = (typeof BACKUP_FREQUENCIES)[number];

/**
 * Names a policy may carry that the server reads off the company's own records rather than off
 * an answer: the processes that must keep running, the order systems come back in, where
 * incidents are reported (from the company's country), who leads in an emergency (from 3.1), and
 * the cryptographic methods the company accepts (its crypto list, 9.1).
 */
export const POLICY_LISTS = [
  "criticalProcesses",
  "recoveryOrder",
  "reportingChannel",
  "emergencyLead",
  "acceptedCrypto",
] as const;
export type PolicyList = (typeof POLICY_LISTS)[number];

/**
 * A policy the walk writes from its own template; the text is in messages/durchgang. The name is
 * also the stored policy type, so it may not be one an editor keeps its settings under.
 */
export type PolicyTemplate =
  | "information_security"
  | "incident_response"
  | "cryptography"
  | "personnel_access"
  | "it_rules"
  | "business_continuity";

export type Screen<C extends CategoryCode> =
  | { readonly kind: "learn"; readonly id: string; readonly link?: LearnLink }
  /**
   * What to have ready before starting, as the law or the BSI lists it. With `confirm`, the next
   * step needs it: the person ticks that they have it at hand, or leaves the item open.
   */
  | { readonly kind: "prepare"; readonly id: string; readonly confirm?: true }
  /** Example: a good and a bad value side by side. */
  | { readonly kind: "compare"; readonly id: string }
  /** Example: a few lines of what the finished list looks like. */
  | {
      readonly kind: "sample";
      readonly id: string;
      /** The company's own document the sample is read against, shown beside it once written. */
      readonly beside?: PolicyTemplate;
    }
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
       * The field that names a person in the company, offered as a pick from the team with the
       * person walking first, and an invite for someone not in it yet.
       */
      readonly person?: CategoryField<C>;
      /** A rule or list shown above the fields, which the answers are read off. */
      readonly provision?: Provision;
      /**
       * A text field whose common answers come from the company's own data, so a tap names what
       * it already has: its software from the list, or addresses at its contact email's domain.
       */
      readonly suggest?: {
        readonly field: CategoryField<C>;
        readonly from: SuggestSource;
      };
    }
  | {
      readonly kind: "evidence";
      readonly id: string;
      /** The intake field an upload fills with the file's name, where the item has one. */
      readonly field: CategoryField<C> | null;
    }
  | { readonly kind: "adopt"; readonly id: string; readonly adopts: Adoptable }
  | {
      readonly kind: "register";
      readonly id: string;
      readonly module: Exclude<RegisterModule, "training_record">;
    }
  | {
      readonly kind: "register";
      readonly id: string;
      readonly module: "training_record";
      readonly audience: TrainingAudience;
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
   * Each listed program and remote access people sign in to, with its rating beside it: whether
   * signing in takes a second factor.
   */
  | { readonly kind: "logins"; readonly id: string }
  /**
   * A policy written from our template: fixed sections, optional clauses the person adds, the
   * company's name and the item's answers filled in. Stored as one `policy` row of the item's
   * requirement.
   */
  | { readonly kind: "policy"; readonly id: string; readonly policy: PolicyTemplate }
  /**
   * Every policy the walk wrote, with its state. Management approves the drafts here, signed in
   * with its own account; anyone else sends them the page.
   */
  | { readonly kind: "approve"; readonly id: string }
  /** Every rated asset and supplier on the 200-3 matrix, and by level: the company's picture. */
  | { readonly kind: "riskmap"; readonly id: string }
  /**
   * The business processes on the company's list: which must keep running without IT
   * (`asset.is_critical`), and in one sentence how, which the item's plan prints.
   */
  | { readonly kind: "critical"; readonly id: string }
  /**
   * The company's backup systems from its list, each with how often it backs up and its last
   * restore that worked (`asset.backup_frequency`, `asset.last_backup_test_date`).
   */
  | { readonly kind: "backups"; readonly id: string }
  /**
   * The cryptographic methods the company accepts: its crypto list (`company_policy_config`
   * type `crypto`), or the BSI TR-02102 list until it has one, which the item's policy prints.
   */
  | { readonly kind: "crypto"; readonly id: string }
  | { readonly kind: "done"; readonly id: string };

export type AnyScreen = Screen<CategoryCode>;
export type ScreenKind = AnyScreen["kind"];

type IsoDate = `${number}-${number}-${number}`;

/**
 * Where the duty card's sentence comes from, so the card opens that exact text: the BSIG paragraph
 * for German readers, the directive's article for everyone else. The requirement's own citations
 * name several provisions and its category link is per category (spec §0.7, correction 3), so
 * neither can serve. A test checks both against the requirement's first citation.
 */
export interface DutyLaw {
  readonly bsig: number;
  readonly article: number;
}

export interface Item<C extends CategoryCode> {
  /** Requirement code in the NIS 2 framework. */
  readonly code: string;
  /** The requirement's category, which types its fields. A test checks it against the framework. */
  readonly category: C;
  readonly law: DutyLaw;
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
