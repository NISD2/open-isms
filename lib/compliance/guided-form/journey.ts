/**
 * Wiring the real journey into the steps. Server side: it reads the framework data and the
 * message files.
 *
 * Kept apart from `steps.ts` so that the splitting rule stays pure and testable, and so that the
 * question of where the journey comes from has exactly one answer. Three existing sources, none of
 * them authored here:
 *
 *   - `nis2.ts`, for the 49 items and their legal references
 *   - `journeyPosition`, the same ordering the guided path, the swimlane and the activation email
 *     read, so these screens cannot disagree with the rest of the product about what comes next
 *   - `REQUIREMENT_FIELD_MAP`, the inversion of the category field mapping, for what each item asks
 *
 * The prose comes from the message files and `data/guidance/<locale>.json`, which is the same
 * content the existing requirement page shows. Nothing is written for these screens.
 */

import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks/nis2";
import { journeyIndex } from "@/lib/compliance/journey-position";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import { rowFieldsFor } from "@/lib/compliance/requirement-rows";
import type { ItemSource } from "./steps";

/**
 * Intake fields the guided form does not ask, and why.
 *
 * Simon, 25.09.2026, on the classification pair: "Einstufung and Sektoren are completely useless.
 * We don't need them at all." The reason is that the BSI portal makes a company classify itself in
 * order to register at all, so asking again is re-doing their homework and inviting a second,
 * different answer to a question the authority has already recorded.
 *
 * They stay in `REG_SCHEMA`, because the existing requirement page still offers them and the
 * column still exists. This list is only about what the guided form puts in front of someone.
 */
const NOT_ASKED: ReadonlySet<string> = new Set([
  "entityClassification",
  "applicableSectors",
]);

/** Everything one screen shows about the item it belongs to. */
export interface ItemContent {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  /** For example "§30(2) Nr. 1 BSIG, CIR 2.1.2". Printed in the sidebar as the source. */
  readonly legalRef: string | null;
  /** The register this item's evidence lives in, where it has one. */
  readonly moduleRef: string | null;
  /** From `data/guidance/<locale>.json`. Explains; the tip is the only thing that advises. */
  readonly summary: string | null;
  readonly applicability: string | null;
  readonly quickTip: string | null;
}

interface RequirementShape {
  readonly code: string;
  readonly legalRef?: string | null;
  readonly moduleRef?: string | null;
}

interface GuidanceShape {
  readonly summary?: string;
  readonly applicability?: string;
  readonly quickTip?: string;
}

/**
 * The last item the flow shows for now.
 *
 * Simon, 25.09.2026, on reaching the per-supplier screens: "everything after this we should just
 * delete for now because I think you're getting mixed up and it's too much context for you."
 * Everything up to and including 5.2 is under review; everything after it is cut from the flow
 * until those are right. This is a cap on the flow, not on the journey: the items still exist.
 */
const LAST_ITEM_FOR_NOW = "5.2";

export const journeyItems = (): readonly ItemSource[] => {
  const all = allJourneyItems();
  const cap = all.find((i) => i.code === LAST_ITEM_FOR_NOW);
  return cap ? all.filter((i) => i.position <= cap.position) : all;
};

/** Every item, uncapped. The label coverage test reads this so a cap never hides a missing label. */
export const allJourneyItems = (): readonly ItemSource[] =>
  nis2Categories
    .flatMap((category) =>
      (getNis2RequirementsForCategory(category.slug) as readonly RequirementShape[]).map(
        (r) => {
          const categoryCode =
            REQUIREMENT_FIELD_MAP[r.code]?.categoryCode ?? category.code;
          const moduleRef = r.moduleRef ?? null;
          return {
            code: r.code,
            categoryCode,
            position: journeyIndex(r.code),
            fields: (REQUIREMENT_FIELD_MAP[r.code]?.fieldKeys ?? []).filter(
              (f) => !NOT_ASKED.has(f),
            ),
            moduleRef,
            rowFields: rowFieldsFor(moduleRef, r.code).filter((f) => !NOT_ASKED.has(f)),
          };
        },
      ),
    )
    .sort((a, b) => a.position - b.position);

/**
 * The prose for every item, keyed by code.
 *
 * Titles and descriptions are keyed with underscores in the message files (`2_2`), which is the
 * existing convention; guidance is keyed with the dots. Both are looked up rather than restated.
 */
export const itemContent = (
  requirementMessages: Readonly<Record<string, { title?: string; description?: string }>>,
  guidance: Readonly<Record<string, GuidanceShape>>,
): ReadonlyMap<string, ItemContent> =>
  new Map(
    nis2Categories
      .flatMap(
        (c) => getNis2RequirementsForCategory(c.slug) as readonly RequirementShape[],
      )
      .map((r) => {
        const msg = requirementMessages[r.code.replaceAll(".", "_")];
        const g = guidance[r.code];
        return [
          r.code,
          {
            code: r.code,
            title: msg?.title ?? r.code,
            description: msg?.description ?? "",
            legalRef: r.legalRef ?? null,
            moduleRef: r.moduleRef ?? null,
            summary: g?.summary ?? null,
            applicability: g?.applicability ?? null,
            quickTip: g?.quickTip ?? null,
          },
        ] as const;
      }),
  );
