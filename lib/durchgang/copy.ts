/**
 * The words of the Durchgang, parsed. messages/durchgang holds them under
 * `items.<code>.screens.<screen id>`, with field and source texts beside the screens. This module
 * is the one reader of that layout, for the screens and for the tests, so a missing string, a
 * misshapen one or one left over from a deleted screen fails a test in every locale rather than
 * showing up on a customer's screen.
 */

import { z } from "zod";
import { type AnyItem, type AnyScreen, askedFields, type ScreenKind } from "./types";

const text = z.string().trim().min(1);
const heading = { title: text, lead: text };
const pair = z.object({ value: text, note: text });

const SCREEN_COPY = {
  /** `link` labels the platform page the screen points to, where the script gives it one. */
  learn: z.object({
    title: text,
    body: z.array(text).min(1),
    duty: text,
    link: text.optional(),
  }),
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
    note: text.optional(),
  }),
  /** One text per example of the script's screen, in its order. */
  reading: z.object({ title: text, caption: text, examples: z.array(text).min(1) }),
  provision: z.object({ ...heading, source: text }),
  fields: z.object({ ...heading, document: text }),
  evidence: z.object({ ...heading, document: text }),
  adopt: z.object({ ...heading, lines: z.array(z.object({ label: text, text })).min(1) }),
  register: z.object(heading),
  sources: z.object(heading),
  assets: z.object(heading),
  specify: z.object(heading),
  rate: z.object(heading),
  /** The two things a row can say is agreed, and the answer that neither is. */
  agreements: z.object({ ...heading, security: text, incidents: text, none: text }),
  /**
   * The policy itself: its fixed sections, the clauses the person may add, and the signature
   * line. `{company}` stands for the company's name and `{<field>}` for the answer to one of the
   * item's fields; both are filled in when the text is written.
   */
  policy: z.object({
    ...heading,
    document: z.object({
      title: text,
      sections: z.array(z.object({ heading: text, text })).min(1),
      clauses: z.array(z.object({ id: text, label: text, heading: text, text })),
      signature: text,
    }),
  }),
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

interface Extras {
  readonly fields: {
    readonly fields: readonly Keyed<string, ItemCopy["fields"][string]>[];
  };
  readonly sources: {
    readonly sources: readonly Keyed<string, ItemCopy["sources"][string]>[];
  };
}

/** A screen with its words. `kind` repeats `screen.kind` at the top, so a switch on it narrows. */
export type ResolvedScreen = {
  readonly [K in ScreenKind]: {
    readonly kind: K;
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

/**
 * Words each language defines once, under `terms`, and the copy names by placeholder. `authority`
 * is the body a company registers with and reports to: "BSI" in German, "your authority" in
 * English. Each language writes its own sentence around it ("beim {authority}", "with
 * {authority}"), so a new language defines the term instead of rewording every string that names
 * it. Guidance the BSI publishes stays attributed to the BSI; it is a source, not the authority.
 */
const TERMS = z.object({ authority: text });
type Terms = z.infer<typeof TERMS>;
const TERM_MARKERS: ReadonlyArray<readonly [string, keyof Terms]> = [
  ["{authority}", "authority"],
];

/** How a policy names something it is written with: the company, or one of the item's answers. */
export const marker = (name: string): string => `{${name}}`;

/** Stands for the company's name in a policy; filled in when the policy is written, not here. */
export const COMPANY_MARKER = marker("company");

/**
 * The copy with every term filled in, and the path of any string that still holds a brace other
 * than the markers a policy may carry, which are left for the policy to fill.
 */
const fill = (
  value: unknown,
  terms: Terms,
  kept: readonly string[],
  where: string,
): { readonly value: unknown; readonly errors: readonly string[] } => {
  if (typeof value === "string") {
    const filled = TERM_MARKERS.reduce(
      (acc, [placeholder, key]) => acc.split(placeholder).join(terms[key]),
      value,
    );
    const unknown = kept.reduce((acc, m) => acc.split(m).join(""), filled).includes("{");
    return {
      value: filled,
      errors: unknown ? [`${where}: unknown placeholder`] : [],
    };
  }
  if (Array.isArray(value)) {
    const parts = value.map((v, i) => fill(v, terms, kept, `${where}.${i}`));
    return { value: parts.map((p) => p.value), errors: parts.flatMap((p) => p.errors) };
  }
  if (typeof value === "object" && value !== null) {
    const parts = Object.entries(value).map(
      ([k, v]) => [k, fill(v, terms, kept, `${where}.${k}`)] as const,
    );
    return {
      value: Object.fromEntries(parts.map(([k, p]) => [k, p.value])),
      errors: parts.flatMap(([, p]) => p.errors),
    };
  }
  return { value, errors: [] };
};

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
  ): Result<{
    readonly kind: S["kind"];
    readonly screen: S;
    readonly copy: z.infer<Z>;
  }> => {
    const copy = parse(schema, raw, where);
    return copy.ok ? ok({ kind: s.kind, screen: s, copy: copy.value }) : copy;
  };
  switch (screen.kind) {
    case "fields": {
      const copy = parse(SCREEN_COPY.fields, raw, where);
      const fields = pick(head.fields, screen.fields, `${base}.fields`);
      return copy.ok && fields.ok
        ? ok({ kind: screen.kind, screen, copy: { ...copy.value, fields: fields.value } })
        : { ok: false, errors: errorsOf(copy, fields) };
    }
    case "sources": {
      const copy = parse(SCREEN_COPY.sources, raw, where);
      const sources = pick(head.sources, screen.sources, `${base}.sources`);
      return copy.ok && sources.ok
        ? ok({
            kind: screen.kind,
            screen,
            copy: { ...copy.value, sources: sources.value },
          })
        : { ok: false, errors: errorsOf(copy, sources) };
    }
    case "learn": {
      const copy = one(screen, SCREEN_COPY.learn);
      return copy.ok && screen.link && !copy.value.copy.link
        ? { ok: false, errors: [`${where}.link: missing`] }
        : copy;
    }
    case "prepare":
      return one(screen, SCREEN_COPY.prepare);
    case "compare":
      return one(screen, SCREEN_COPY.compare);
    case "sample":
      return one(screen, SCREEN_COPY.sample);
    case "reading": {
      const copy = one(screen, SCREEN_COPY.reading);
      return copy.ok && copy.value.copy.examples.length !== screen.examples.length
        ? {
            ok: false,
            errors: [
              `${where}.examples: ${copy.value.copy.examples.length} texts for ${screen.examples.length} examples`,
            ],
          }
        : copy;
    }
    case "provision":
      return one(screen, SCREEN_COPY.provision);
    case "evidence":
      return one(screen, SCREEN_COPY.evidence);
    case "adopt":
      return one(screen, SCREEN_COPY.adopt);
    case "register":
      return one(screen, SCREEN_COPY.register);
    case "assets":
      return one(screen, SCREEN_COPY.assets);
    case "specify":
      return one(screen, SCREEN_COPY.specify);
    case "rate":
      return one(screen, SCREEN_COPY.rate);
    case "agreements":
      return one(screen, SCREEN_COPY.agreements);
    case "policy": {
      // A clause is chosen and stored by its id, so two clauses may not share one.
      const copy = one(screen, SCREEN_COPY.policy);
      const ids = copy.ok ? copy.value.copy.document.clauses.map((c) => c.id) : [];
      return new Set(ids).size !== ids.length
        ? { ok: false, errors: [`${where}.document.clauses: duplicate id`] }
        : copy;
    }
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
  const terms = parse(TERMS, at(namespace, "terms"), "terms");
  if (!terms.ok) return terms;
  const kept = [COMPANY_MARKER, ...askedFields(item).map(marker)];
  const filled = fill(
    at(at(namespace, "items"), itemKey(item.code)),
    terms.value,
    kept,
    base,
  );
  if (filled.errors.length > 0) return { ok: false, errors: filled.errors };
  const head = parse(ITEM_COPY, filled.value, base);
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
      screens.flatMap((s) => (s.kind === "fields" ? s.fields : [])),
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
