import type { InferSelectModel } from "drizzle-orm";
import type { requirement } from "../schema/requirement";

export interface FrameworkCategory {
  id: string;
  code: string;
  slug: string;
  sortOrder: number;
  estimatedMinutes: number;
  relevantRoles?: string[];
  grundschutzModule?: string;
  /**
   * English default display name. Consumers with i18n (e.g. the
   * nisd2.eu app) override this via their own message catalog keyed
   * by category code; consumers without i18n (the OSS open-isms app)
   * render this directly.
   */
  name?: string;
  /** English default one-line description. Same i18n caveat as `name`. */
  description?: string;
  /**
   * URL to the framework's primary source of truth for this category.
   * - NIS 2: EUR-Lex / nis-2-directive.com link to the relevant Article.
   * - GDPR: EUR-Lex link to the relevant Article.
   * - EU AI Act: EUR-Lex link to the relevant Article.
   * - EU CRA: EUR-Lex link to Regulation 2024/2847.
   * - ISO 27001 / ISO 42001: iso.org standard page.
   */
  referenceUrl: string;
  /**
   * Optional national implementation reference (e.g. BSIG paragraph for
   * Germany under NIS 2). Empty string for frameworks without a national
   * transposition (ISO standards, EU regulations that apply directly).
   */
  nationalUrl: string;
}

export type EvidenceType = "document" | "proof" | "sign-off" | "technical" | "training";

export type Priority = "P0" | "P1" | "P2" | "P3";

export type Importance = "mandatory" | "recommended" | "enhanced";

export type Frequency =
  | "one-time"
  | "monthly"
  | "quarterly"
  | "semi-annual"
  | "annual"
  | "every-3-years"
  | "on-change"
  | "ongoing";

export interface FrameworkRequirement {
  id: string;
  code: string;
  evidenceType: EvidenceType;
  frequency: Frequency;
  priority: Priority;
  importance: Importance;
  /**
   * Long-form human-readable legal/standard reference.
   * Example: "ISO 27001:2022 Cl. 4.1" or "Art. 21(2)(a) NIS 2".
   */
  legalRef: string;
  /**
   * Short structured reference within the framework.
   * - NIS 2 / GDPR / AI Act / CRA: Article number like "21(2)(a)".
   * - ISO 27001 / ISO 42001: Clause or Annex A code like "5.1" or "A.5.9".
   */
  frameworkRef: string | null;
  /** CIR 2024/2690 Annex sub-section reference, e.g. "1.1.1" (NIS 2 only). */
  cirReference: string | null;
  /** Optional reference to a platform module that satisfies this requirement. */
  moduleRef: string | null;
  /** Role whose sign-off is required for this requirement, if any. */
  requiredSignOffRole: string | null;
  /** Where Czech law places the requirement (NIS 2 only), as `legalRef` names the BSIG. */
  czechRef: CzechRef | null;
}

/**
 * Where Czech law places a NIS 2 requirement, as `legalRef` does for the BSIG. Czech law splits
 * the measures by regime: decree 410/2025 Sb. for the lower one, 409/2025 Sb. for the higher one,
 * and the Portál NÚKIB shows a company which applies (its registration decision does not, as the
 * regime can change). Each value is a citation
 * in Czech style ("§ 4 písm. b); § 5 odst. 2 písm. a)"); null where that text has no place for
 * the requirement.
 */
export interface CzechRef {
  /** Sections of zákon č. 264/2025 Sb. that carry the duty themselves, beside the decrees. */
  readonly act: string | null;
  /** Vyhláška č. 410/2025 Sb., the lower regime. */
  readonly lower: string | null;
  /** Vyhláška č. 409/2025 Sb., the higher regime. */
  readonly higher: string | null;
}

/** The `requirement` columns a `CzechRef` is stored in. */
export type CzechRefColumns = Readonly<
  Pick<InferSelectModel<typeof requirement>, "czActRef" | "czLowerRef" | "czHigherRef">
>;

/** A `CzechRef` as its row stores it; every column null where Czech law has no place for it. */
export const czechRefColumns = (ref: CzechRef | null): CzechRefColumns => ({
  czActRef: ref?.act ?? null,
  czLowerRef: ref?.lower ?? null,
  czHigherRef: ref?.higher ?? null,
});

export interface RequirementOptions {
  priority?: Priority;
  importance?: Importance;
  frequency?: Frequency;
  legalRef?: string;
  frameworkRef?: string;
  cirReference?: string;
  moduleRef?: string;
  requiredSignOffRole?: string;
}

export function makeRequirementFactory(idPrefix: string) {
  let n = 0;
  return function mkReq(
    code: string,
    evidenceType: EvidenceType,
    opts: RequirementOptions = {},
  ): FrameworkRequirement {
    n++;
    return {
      id: `${idPrefix}-${n}`,
      code,
      evidenceType,
      frequency: opts.frequency ?? "annual",
      priority: opts.priority ?? "P1",
      importance: opts.importance ?? "mandatory",
      legalRef: opts.legalRef ?? "",
      frameworkRef: opts.frameworkRef ?? null,
      cirReference: opts.cirReference ?? null,
      moduleRef: opts.moduleRef ?? null,
      requiredSignOffRole: opts.requiredSignOffRole ?? null,
      czechRef: null,
    };
  };
}
