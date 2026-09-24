/**
 * The journey, split so that every screen asks one question. Pure: no database, no React, no IO.
 *
 * **What this is not.** Two earlier versions put a questionnaire in front of the Durchgang: the
 * proportionality engine on 24.09.2026, retired after measurement showed the perfect set of answers
 * moved four decisions out of about 144, and an onboarding rebuild of it on 25.09 that asked
 * twenty-one options to move four of fifty-three items. Both are deleted, and the standing rule is
 * Simon's: the BSI portal already makes a company classify itself in order to register, so asking
 * again is re-doing their homework.
 *
 * The screens are the journey and nothing else. Every input is a structure that already existed:
 *
 *   `journeyPosition`          the order, shared with the guided path, the swimlane and the
 *                              activation email, so these screens cannot disagree with the rest of
 *                              the product about what comes next
 *   `REQUIREMENT_FIELD_MAP`    which intake fields an item asks
 *   `moduleRef`                which register backs an item
 *   `rowFieldsFor`             which fields an item asks **per row** of that register
 *
 * The last one is the shape of the work here. An item backed by a register costs `rows x fields`
 * screens, so an empty supplier register costs one screen and a forty-supplier one costs two
 * hundred. That is where the real reduction lives, and it happens where the register is read rather
 * than in an interview beforehand.
 */

import type { ItemState } from "./policy";

// ---------------------------------------------------------------------------
// What a screen can ask
// ---------------------------------------------------------------------------

/**
 * fields    one or more intake fields, validated by the category schema
 * row       one or more fields about ONE row of a register, repeated for every row
 * register  the item is satisfied by the register existing and being confirmed, not by answering
 *           something about each entry
 */
export type Ask =
  | { readonly kind: "fields"; readonly fields: readonly string[] }
  | { readonly kind: "row"; readonly module: string; readonly fields: readonly string[] }
  | { readonly kind: "register"; readonly module: string };

/**
 * One field of an item, with the only thing the splitter needs to know about it.
 *
 * `simple` is the grouping rule, and it is about the cost of answering rather than the count.
 * A tick is not a question; a page of ticks is one question. A date, a free text or an enum with a
 * real choice in it is its own screen, because each one makes the reader stop and think.
 */
export interface SourceField {
  readonly key: string;
  readonly simple: boolean;
}

/** One journey item, as the framework data and the existing maps already describe it. */
export interface ItemSource {
  readonly code: string;
  /** Category code, for looking up the schema that validates the fields. */
  readonly categoryCode: string;
  /** From `journeyPosition`. Lower comes first. */
  readonly position: number;
  /** Intake fields, in the order the schema declares them. May be empty. */
  readonly fields: readonly SourceField[];
  /** The register that backs this item, where there is one. */
  readonly moduleRef: string | null;
  /** From `rowFieldsFor`. Non-empty makes this item's length depend on the company. */
  readonly rowFields: readonly SourceField[];
}

/**
 * Split a field list into screens: every run of simple fields becomes one screen, every other
 * field becomes its own.
 *
 * Runs rather than "all the simple ones together", so the schema's own order survives. Reordering
 * a form to suit the grouping would put fields in front of a reader in an order nobody chose.
 */
export const groupFields = (
  fields: readonly SourceField[],
): readonly (readonly string[])[] =>
  fields
    .reduce<SourceField[][]>((groups, f) => {
      const last = groups.at(-1);
      if (f.simple && last?.every((x) => x.simple)) last.push(f);
      else groups.push([f]);
      return groups;
    }, [])
    .map((group) => group.map((f) => f.key));

/** A screen before it is expanded against the company's registers. */
export interface Template {
  readonly item: string;
  readonly categoryCode: string;
  readonly moduleRef: string | null;
  readonly ask: Ask;
}

export interface Screen {
  /** Stable and URL-safe. */
  readonly id: string;
  readonly item: string;
  readonly categoryCode: string;
  readonly ask: Ask;
  /** Set only on a row screen. */
  readonly row: Row | null;
}

export interface Row {
  readonly id: string;
  readonly label: string;
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

/**
 * Turn the journey into templates, in journey order.
 *
 * Precedence is deliberate. Per-row fields win, because an item that asks something about every
 * supplier is that work and not a single question. Then plain intake fields. An item with neither
 * but a register is a register screen. An item with nothing at all still gets one screen, because
 * dropping it would hide an item from the Durchgang and the counts the company sees would stop
 * matching the register.
 */
export const buildTemplates = (items: readonly ItemSource[]): readonly Template[] =>
  [...items]
    .sort((a, b) => a.position - b.position || a.code.localeCompare(b.code))
    .flatMap((item): Template[] => {
      const base = {
        item: item.code,
        categoryCode: item.categoryCode,
        moduleRef: item.moduleRef,
      };
      if (item.rowFields.length > 0 && item.moduleRef) {
        const module = item.moduleRef;
        return groupFields(item.rowFields).map((fields) => ({
          ...base,
          ask: { kind: "row", module, fields },
        }));
      }
      if (item.fields.length > 0) {
        return groupFields(item.fields).map((fields) => ({
          ...base,
          ask: { kind: "fields", fields },
        }));
      }
      return [{ ...base, ask: { kind: "register", module: item.moduleRef ?? "" } }];
    });

/**
 * Expand the templates against what the company actually has.
 *
 * A row template with no rows collapses to a single register screen rather than disappearing. That
 * is the `no_object` case from the policy: nothing to answer, and the empty register is the
 * evidence. It is also the only honest way to show that the work went away.
 */
export const expand = (
  templates: readonly Template[],
  rowsOf: (module: string) => readonly Row[],
): readonly Screen[] => {
  // An item with several per-row field groups collapses them all onto the SAME register screen
  // when the register is empty, so the collapse has to be emitted once. Without this an item with
  // two per-row groups showed a company with no suppliers the same screen twice.
  const collapsed = new Set<string>();
  return templates.flatMap((t): Screen[] => {
    if (t.ask.kind !== "row") {
      return [
        {
          id: screenId(t, null),
          item: t.item,
          categoryCode: t.categoryCode,
          ask: t.ask,
          row: null,
        },
      ];
    }
    const { module, fields } = t.ask;
    const rows = rowsOf(module);
    if (rows.length === 0) {
      const id = `${t.item}:${module}`;
      if (collapsed.has(id)) return [];
      collapsed.add(id);
      const ask = { kind: "register", module } as const;
      return [{ id, item: t.item, categoryCode: t.categoryCode, ask, row: null }];
    }
    return rows.map((row) => ({
      id: screenId(t, row),
      item: t.item,
      categoryCode: t.categoryCode,
      ask: { kind: "row", module, fields },
      row,
    }));
  });
};

const screenId = (t: Template, row: Row | null): string => {
  const suffix = row ? `:${row.id}` : "";
  switch (t.ask.kind) {
    case "fields":
    case "row":
      return `${t.item}:${t.ask.fields.join("+")}${suffix}`;
    case "register":
      return t.ask.module ? `${t.item}:${t.ask.module}` : t.item;
  }
};

/**
 * How many screens an item costs, given the registers. Deduplicates the collapsed empty-register
 * case, so an item with five per-row fields and no rows counts as one and not five.
 */
export const screenCount = (screens: readonly Screen[]): ReadonlyMap<string, number> => {
  const byItem = new Map<string, Set<string>>();
  for (const s of screens) {
    const ids = byItem.get(s.item) ?? new Set<string>();
    ids.add(s.id);
    byItem.set(s.item, ids);
  }
  return new Map([...byItem].map(([item, ids]) => [item, ids.size]));
};

// ---------------------------------------------------------------------------
// What the company has said so far
// ---------------------------------------------------------------------------

/**
 * A step left waiting: a recorded state with a reason, never a skip and never a failure.
 *
 * Item 12.2, the BSI registration, is the example that makes this compulsory rather than nice. It
 * answers by post. Without it the first externally blocked step stops the whole Durchgang on day
 * one, in the exact place the visitor was supposed to feel progress.
 */
export interface Waiting {
  readonly reason: string;
  /** ISO date, where they named one. A wait with no date is still a wait. */
  readonly until?: string;
}

export interface Answers {
  /**
   * Keyed by screen id rather than by field name, because a row screen asks the same field about
   * many rows and the answers are not the same answer.
   */
  readonly values: Readonly<Record<string, unknown>>;
  readonly waiting: Readonly<Record<string, Waiting>>;
}

export const NOTHING_ANSWERED: Answers = { values: {}, waiting: {} };

/** An answer is present when it is not empty. An empty string is not an answer. */
export const hasValue = (v: unknown): boolean =>
  v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "");

// ---------------------------------------------------------------------------
// State and navigation
// ---------------------------------------------------------------------------

/** The fields a screen collects. Empty where it asks about a register as a whole. */
export const fieldsOf = (screen: Screen): readonly string[] =>
  screen.ask.kind === "register" ? [] : screen.ask.fields;

/** Where a screen's answers are stored: one key per field, scoped to the screen. */
export const answerKey = (screen: Screen, field: string): string =>
  `${screen.id}#${field}`;

/**
 * A screen's state, in the policy's own vocabulary so `resumeAt` works over screens and items alike.
 *
 * `required` is passed in rather than restated, because which fields are required is decided by the
 * Zod schema and duplicating that would let the two drift. A screen is settled once every field on
 * it that the schema requires has an answer, so an optional field can never hold the journey open.
 */
export const screenState = (
  screen: Screen,
  a: Answers,
  required: ReadonlySet<string>,
): ItemState => {
  const fields = fieldsOf(screen);
  const must = fields.filter((f) => required.has(f));
  const answered =
    fields.length === 0
      ? hasValue(a.values[screen.id])
      : must.every((f) => hasValue(a.values[answerKey(screen, f)]));
  if (answered) return "settled";
  return a.waiting[screen.id] ? "blocked" : "open";
};

/** Every screen of the journey can be left waiting. That is the point of the state. */
export const canWait = (): boolean => true;

export const screenIndex = (screens: readonly Screen[], id: string): number =>
  screens.findIndex((s) => s.id === id);

export const screenById = (screens: readonly Screen[], id: string): Screen | null =>
  screens.find((s) => s.id === id) ?? null;

export const screenAfter = (screens: readonly Screen[], id: string): Screen | null =>
  screens[screenIndex(screens, id) + 1] ?? null;

export const screenBefore = (screens: readonly Screen[], id: string): Screen | null => {
  const i = screenIndex(screens, id);
  return i > 0 ? (screens[i - 1] ?? null) : null;
};

/** Item-level state, which is what the sign-off path reads. */
export const itemStates = (
  screens: readonly Screen[],
  a: Answers,
  required: ReadonlySet<string>,
): ReadonlyMap<string, ItemState> => {
  const byItem = new Map<string, ItemState[]>();
  for (const s of screens) {
    const list = byItem.get(s.item) ?? [];
    list.push(screenState(s, a, required));
    byItem.set(s.item, list);
  }
  return new Map(
    [...byItem].map(([item, states]) => {
      const unfinished = states.filter((x) => x !== "settled");
      if (unfinished.length === 0) return [item, "settled" as const];
      return [item, unfinished.every((x) => x === "blocked") ? "blocked" : "open"];
    }),
  );
};
