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
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { journeyPosition } from "@/lib/compliance/journey-position";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import { ROW_SCHEMA, rowFieldsFor } from "@/lib/compliance/requirement-rows";
import { type FieldType, introspectSchema } from "@/lib/forms/schema-introspect";
import type { ItemSource, SourceField } from "./steps";

/**
 * Which field types are cheap enough to share a screen.
 *
 * Only a tick. Simon's rule: "if they're just checkboxes or toggle buttons or something simple, you
 * can add more than one per screen". Everything else makes the reader stop and think, and two
 * things that make you stop and think do not belong on one screen.
 */
const SIMPLE_TYPES: ReadonlySet<FieldType> = new Set<FieldType>(["boolean"]);

/** Field type by key, per schema, introspected once from the schema that owns the column. */
const typesIn = (
  schema: Parameters<typeof introspectSchema>[0],
): ReadonlyMap<string, FieldType> =>
  new Map(introspectSchema(schema, []).map((m) => [m.key, m.type] as const));

const CATEGORY_TYPES = new Map(
  Object.entries(CATEGORY_SCHEMAS).map(([code, s]) => [code, typesIn(s)] as const),
);
const ROW_TYPES = new Map(
  Object.entries(ROW_SCHEMA).map(([module, s]) => [module, typesIn(s)] as const),
);

const toSourceFields = (
  keys: readonly string[],
  types: ReadonlyMap<string, FieldType> | undefined,
): readonly SourceField[] =>
  keys.map((key) => ({ key, simple: SIMPLE_TYPES.has(types?.get(key) ?? "unknown") }));

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
  readonly priority?: string | null;
  readonly sortOrder?: number | null;
  readonly legalRef?: string | null;
  readonly moduleRef?: string | null;
}

interface GuidanceShape {
  readonly summary?: string;
  readonly applicability?: string;
  readonly quickTip?: string;
}

/** The journey items in the order the rest of the product already uses. */
export const journeyItems = (): readonly ItemSource[] =>
  nis2Categories
    .flatMap((category, ci) =>
      (getNis2RequirementsForCategory(category.slug) as readonly RequirementShape[]).map(
        (r, ri) => {
          const categoryCode =
            REQUIREMENT_FIELD_MAP[r.code]?.categoryCode ?? category.code;
          const moduleRef = r.moduleRef ?? null;
          return {
            code: r.code,
            categoryCode,
            position: journeyPosition(
              r.priority,
              category.sortOrder ?? ci,
              r.sortOrder ?? ri,
            ),
            fields: toSourceFields(
              REQUIREMENT_FIELD_MAP[r.code]?.fieldKeys ?? [],
              CATEGORY_TYPES.get(categoryCode),
            ),
            moduleRef,
            rowFields: toSourceFields(
              rowFieldsFor(moduleRef, r.code),
              moduleRef ? ROW_TYPES.get(moduleRef) : undefined,
            ),
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
