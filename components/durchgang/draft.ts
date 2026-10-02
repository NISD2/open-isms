import type { AssetLayer } from "@/lib/asset-inventory/types";
import type { MfaMethod, RatedKind, Rating } from "@/lib/durchgang";
import type { FieldMeta } from "@/lib/forms/schema-introspect";

/**
 * An asset as the "which one exactly" screen edits it: its name, what it is for in the company's
 * words, and who provides it, any number of suppliers by name; none is run in house or not known
 * yet.
 */
export interface Specified {
  readonly name: string;
  readonly description: string;
  readonly providers: readonly string[];
}

/** A backup system as 4.4 records it: how often it backs up, and its last restore that worked. */
export interface Backup {
  readonly frequency: string | null;
  /** A calendar day, YYYY-MM-DD, or empty while no restore has worked yet. */
  readonly lastRestore: string;
}

/**
 * A rating being chosen for one asset or supplier; either scale may still be open. The note is
 * the person's own line on it, undefined until they write one.
 */
export type RatingDraft = Partial<Rating> & {
  readonly kind: RatedKind;
  readonly id: string;
  readonly note?: string;
};

/** What the person has entered on this item so far, kept while they move between its screens. */
export interface Draft {
  /** Intake field values, as the inputs hold them. */
  readonly values: Readonly<Record<string, unknown>>;
  /** Whether the person ticked that they have at hand what the next step needs. */
  readonly ready: boolean;
  /** Whether the person ticked that the BSI's crypto list applies to them, so it is taken over. */
  readonly adopt: boolean;
  /** Ticked catalogue items on the asset screens. */
  readonly checked: readonly string[];
  readonly custom: ReadonlyArray<{ name: string; layer: AssetLayer }>;
  readonly uploaded: string | null;
  /** Edited assets, by id. Only rows the person touched; the others show what is stored. */
  readonly specified: Readonly<Record<string, Specified>>;
  /** Ratings chosen on this visit, by `ratingKey`. */
  readonly ratings: Readonly<Record<string, RatingDraft>>;
  /** The policy clauses chosen on this visit; null until the person changes the stored choice. */
  readonly clauses: readonly string[] | null;
  /** The policy's addition in the company's own words; null until the person edits it. */
  readonly own: string | null;
  /** Whether the person confirmed on this visit that they have read the policy. */
  readonly read: boolean;
  /** What each supplier has agreed, by supplier id, for the rows answered on this visit. */
  readonly agreements: Readonly<Record<string, Agreed>>;
  /**
   * Whether signing in takes a second factor, by asset id, for the rows answered on this visit;
   * null is "not known yet".
   */
  readonly logins: Readonly<Record<string, boolean | null>>;
  /** Which second factor each sign-in takes, by asset id, chosen on this visit. */
  readonly methods: Readonly<Record<string, MfaMethod | null>>;
  /** Which processes must keep running without IT, and how, by asset id, changed on this visit. */
  readonly critical: Readonly<Record<string, Critical>>;
  /** The backup systems' answers, by asset id, changed on this visit. */
  readonly backups: Readonly<Record<string, Backup>>;
}

/** A supplier's answer on 5.2: neither ticked means the person found nothing agreed. */
export interface Agreed {
  readonly security: boolean;
  readonly incidents: boolean;
}

/** A process on 4.2: whether it must keep running without IT, and the line on how. */
export interface Critical {
  readonly on: boolean;
  readonly how: string;
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
  ready: false,
  adopt: false,
  checked: [],
  custom: [],
  uploaded: null,
  specified: {},
  ratings: {},
  clauses: null,
  own: null,
  read: false,
  agreements: {},
  logins: {},
  methods: {},
  critical: {},
  backups: {},
});

/** A rating with both scales chosen, or null. */
export const fullRating = (rating: Partial<Rating> | undefined): Rating | null =>
  rating?.frequency && rating.impact
    ? { frequency: rating.frequency, impact: rating.impact }
    : null;

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
