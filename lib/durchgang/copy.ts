/**
 * The words of the Durchgang, parsed. messages/durchgang holds them under
 * `items.<code>.screens.<screen id>`, with field and source texts beside the screens. This module
 * is the one reader of that layout, for the screens and for the tests, so a missing string, a
 * misshapen one or one left over from a deleted screen fails a test in every locale rather than
 * showing up on a customer's screen.
 */

import { z } from "zod";
import type { AnyItem, AnyScreen, ScreenKind } from "./types";

const text = z.string().trim().min(1);
const heading = { title: text, lead: text };
const pair = z.object({ value: text, note: text });

const SCREEN_COPY = {
  learn: z.object({ title: text, body: z.array(text).min(1), duty: text }),
  prepare: z.object({
    ...heading,
    items: z.array(z.object({ name: text, detail: text })).min(1),
    source: text,
  }),
  compare: z.object({ title: text, caption: text, good: pair, bad: pair }),
  sample: z.object({
    title: text,
    caption: text,
    rows: z.array(z.object({ name: text, detail: text })).min(1),
  }),
  reading: z.object({ title: text, caption: text }),
  provision: z.object({ ...heading, source: text }),
  fields: z.object({ ...heading, document: text }),
  evidence: z.object({ ...heading, document: text }),
  adopt: z.object({ ...heading, lines: z.array(z.object({ label: text, text })).min(1) }),
  fixed: z.object({ ...heading, source: text }),
  register: z.object(heading),
  decide: z.object({ ...heading, source: text }),
  sources: z.object(heading),
  assets: z.object(heading),
  done: z.object({ title: text, note: text }),
} as const satisfies Record<ScreenKind, z.ZodType>;

const ITEM_COPY = z.object({
  headline: text,
  teaser: text,
  missed: z.array(text).min(1),
  screens: z.record(z.string(), z.unknown()),
  fields: z
    .record(
      z.string(),
      z.object({
        label: text,
        hint: text,
        /** One label per value, for a field whose schema is a choice. A test checks the set. */
        options: z.record(z.string(), text).optional(),
      }),
    )
    .default({}),
  sources: z.record(z.string(), z.object({ label: text, text })).default({}),
});

type ItemCopy = z.infer<typeof ITEM_COPY>;

type Keyed<K extends string, V> = V & { readonly key: K };

type FieldCopy = readonly Keyed<string, ItemCopy["fields"][string]>[];

interface Extras {
  readonly fields: { readonly fields: FieldCopy };
  readonly fixed: { readonly fields: FieldCopy };
  readonly sources: {
    readonly sources: readonly Keyed<string, ItemCopy["sources"][string]>[];
  };
}

export type ResolvedScreen = {
  readonly [K in ScreenKind]: {
    readonly screen: Extract<AnyScreen, { kind: K }>;
    readonly copy: z.infer<(typeof SCREEN_COPY)[K]> &
      (K extends keyof Extras ? Extras[K] : unknown);
  };
}[ScreenKind];

export interface ResolvedItem {
  readonly item: AnyItem;
  readonly headline: string;
  readonly teaser: string;
  readonly missed: readonly string[];
  readonly screens: readonly ResolvedScreen[];
}

type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly string[] };

/** Message files cannot carry dots in keys. */
export const itemKey = (code: string): string => code.split(".").join("_");

const ok = <T>(value: T): Result<T> => ({ ok: true, value });

const errorsOf = (...results: readonly Result<unknown>[]): readonly string[] =>
  results.flatMap((r) => (r.ok ? [] : r.errors));

const at = (value: unknown, key: string): unknown =>
  typeof value === "object" && value !== null && Object.hasOwn(value, key)
    ? (value as Readonly<Record<string, unknown>>)[key]
    : undefined;

const parse = <S extends z.ZodType>(
  schema: S,
  raw: unknown,
  where: string,
): Result<z.infer<S>> => {
  const parsed = schema.safeParse(raw);
  return parsed.success
    ? ok(parsed.data)
    : {
        ok: false,
        errors: parsed.error.issues.map(
          (issue) => `${[where, ...issue.path.map(String)].join(".")}: ${issue.message}`,
        ),
      };
};

const pick = <K extends string, V>(
  record: Readonly<Record<string, V>>,
  keys: readonly K[],
  where: string,
): Result<readonly Keyed<K, V>[]> => {
  const missing = keys.filter((key) => !Object.hasOwn(record, key));
  return missing.length > 0
    ? { ok: false, errors: missing.map((key) => `${where}.${key}: missing`) }
    : ok(keys.map((key) => ({ ...record[key], key })));
};

/** The intake fields a screen shows with a label: the ones it asks, and the ones it fixes. */
export const labelledFields = (screen: AnyScreen): readonly string[] =>
  screen.kind === "fields"
    ? screen.fields
    : screen.kind === "fixed"
      ? Object.keys(screen.values)
      : [];

/** Copy with no screen, field or source left to show it is a deleted screen's leftover. */
const unused = (present: readonly string[], used: readonly string[], where: string) =>
  present.filter((key) => !used.includes(key)).map((key) => `${where}.${key}: unused`);

function resolveScreen(
  head: ItemCopy,
  screen: AnyScreen,
  base: string,
): Result<ResolvedScreen> {
  const where = `${base}.screens.${screen.id}`;
  const raw = head.screens[screen.id];
  const one = <S extends AnyScreen, Z extends z.ZodType>(
    s: S,
    schema: Z,
  ): Result<{ readonly screen: S; readonly copy: z.infer<Z> }> => {
    const copy = parse(schema, raw, where);
    return copy.ok ? ok({ screen: s, copy: copy.value }) : copy;
  };
  switch (screen.kind) {
    case "fields": {
      const copy = parse(SCREEN_COPY.fields, raw, where);
      const fields = pick(head.fields, screen.fields, `${base}.fields`);
      return copy.ok && fields.ok
        ? ok({ screen, copy: { ...copy.value, fields: fields.value } })
        : { ok: false, errors: errorsOf(copy, fields) };
    }
    case "sources": {
      const copy = parse(SCREEN_COPY.sources, raw, where);
      const sources = pick(head.sources, screen.sources, `${base}.sources`);
      return copy.ok && sources.ok
        ? ok({ screen, copy: { ...copy.value, sources: sources.value } })
        : { ok: false, errors: errorsOf(copy, sources) };
    }
    case "learn":
      return one(screen, SCREEN_COPY.learn);
    case "prepare":
      return one(screen, SCREEN_COPY.prepare);
    case "compare":
      return one(screen, SCREEN_COPY.compare);
    case "sample":
      return one(screen, SCREEN_COPY.sample);
    case "reading":
      return one(screen, SCREEN_COPY.reading);
    case "provision":
      return one(screen, SCREEN_COPY.provision);
    case "evidence":
      return one(screen, SCREEN_COPY.evidence);
    case "adopt":
      return one(screen, SCREEN_COPY.adopt);
    case "fixed": {
      const copy = parse(SCREEN_COPY.fixed, raw, where);
      const fields = pick(head.fields, labelledFields(screen), `${base}.fields`);
      return copy.ok && fields.ok
        ? ok({ screen, copy: { ...copy.value, fields: fields.value } })
        : { ok: false, errors: errorsOf(copy, fields) };
    }
    case "register":
      return one(screen, SCREEN_COPY.register);
    case "decide":
      return one(screen, SCREEN_COPY.decide);
    case "assets":
      return one(screen, SCREEN_COPY.assets);
    case "done":
      return one(screen, SCREEN_COPY.done);
    default:
      return screen satisfies never;
  }
}

/**
 * An item's words in one locale. `namespace` is the parsed `durchgang` message namespace; it is
 * checked here rather than trusted, because message files are edited by hand.
 */
export function resolveItem(namespace: unknown, item: AnyItem): Result<ResolvedItem> {
  const base = `items.${itemKey(item.code)}`;
  const head = parse(ITEM_COPY, at(at(namespace, "items"), itemKey(item.code)), base);
  if (!head.ok) return head;

  const screens: readonly AnyScreen[] = item.screens;
  const resolved = screens.map((screen) => resolveScreen(head.value, screen, base));
  const errors = [
    ...errorsOf(...resolved),
    ...unused(
      Object.keys(head.value.screens),
      screens.map((s) => s.id),
      `${base}.screens`,
    ),
    ...unused(
      Object.keys(head.value.fields),
      screens.flatMap(labelledFields),
      `${base}.fields`,
    ),
    ...unused(
      Object.keys(head.value.sources),
      screens.flatMap((s) => (s.kind === "sources" ? s.sources : [])),
      `${base}.sources`,
    ),
  ];
  if (errors.length > 0) return { ok: false, errors };

  return ok({
    item,
    headline: head.value.headline,
    teaser: head.value.teaser,
    missed: head.value.missed,
    screens: resolved.flatMap((r) => (r.ok ? [r.value] : [])),
  });
}
