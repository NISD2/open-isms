import type { AssetLayer } from "@/lib/asset-inventory/types";
import type { SourceId } from "@/lib/durchgang";
import type { FieldMeta } from "@/lib/forms/schema-introspect";

/** What the person has entered on this item so far, kept while they move between its screens. */
export interface Draft {
  /** Intake field values, as the inputs hold them. */
  readonly values: Readonly<Record<string, unknown>>;
  readonly sources: readonly SourceId[];
  /** Ticked catalogue items on the asset screens. */
  readonly checked: readonly string[];
  readonly custom: ReadonlyArray<{ name: string; layer: AssetLayer }>;
  readonly uploaded: string | null;
}

export type DraftUpdate = (next: Draft) => void;

type Fields = Readonly<Record<string, FieldMeta>>;

/** A value as an input holds it: dates as YYYY-MM-DD, everything else as text. */
export const asInput = (meta: FieldMeta | undefined, value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (meta?.type === "date") return String(value).slice(0, 10);
  return String(value);
};

/** A stored answer as the draft holds it: yes or no stays a boolean, everything else as input text. */
export const toDraft = (meta: FieldMeta | undefined, value: unknown): unknown =>
  meta?.type === "boolean" && typeof value === "boolean" ? value : asInput(meta, value);

/**
 * An answer as the intake save takes it: numbers as numbers, and an emptied field as null, which
 * the save stores as cleared. Undefined means there is nothing valid to send.
 */
export const toAnswer = (meta: FieldMeta | undefined, value: unknown): unknown => {
  if (value === "" || value === null || value === undefined) return null;
  if (meta?.type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return typeof value === "string" ? value.trim() : value;
};

/** Whether a draft value answers its field: a real number, a yes or no, or some text. */
export const isAnswered = (meta: FieldMeta | undefined, value: unknown): boolean => {
  if (meta?.type === "boolean") return typeof value === "boolean";
  if (value === null || value === undefined || String(value).trim() === "") return false;
  return meta?.type === "number" ? Number.isFinite(Number(value)) : true;
};

/** The draft an item opens with: its stored answers, and nothing chosen yet. */
export const initialDraft = (
  answers: Readonly<Record<string, unknown>>,
  fields: Fields,
): Draft => ({
  values: Object.fromEntries(
    Object.entries(answers).map(([k, v]) => [k, toDraft(fields[k], v)]),
  ),
  sources: [],
  checked: [],
  custom: [],
  uploaded: null,
});

/** What a screen of fields sends: only the keys that differ from what the server holds. */
export const changedAnswers = (
  keys: readonly string[],
  values: Readonly<Record<string, unknown>>,
  saved: Readonly<Record<string, unknown>>,
  fields: Fields,
): Record<string, unknown> =>
  Object.fromEntries(
    keys.flatMap((key) => {
      if (values[key] === saved[key]) return [];
      const answer = toAnswer(fields[key], values[key]);
      return answer === undefined ? [] : [[key, answer]];
    }),
  );
