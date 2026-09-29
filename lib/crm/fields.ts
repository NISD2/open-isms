/**
 * What the platform knows about a person that sales reads in Close, and how each
 * fact becomes a Close custom field value.
 *
 * Every field lives where it belongs in Close. Facts about the person go on their
 * contact, so colleagues on one company lead never overwrite each other and an
 * erasure that deletes the contact takes them along. Facts about the company go on
 * the lead; a person with no open company writes none, and colleagues of the same
 * company write the same values. Create each field in Close at that level: a
 * contact custom field or a lead custom field.
 *
 * To sync a new fact: add it to CloseFacts, compute it in ./facts, add one entry
 * here, create the field in Close, and put its id under the new key in
 * CLOSE_FIELD_IDS. The sync fingerprints what it last wrote per person, so a new
 * field id changes every fingerprint and the following runs write the new field
 * to everyone already in Close, a batch per run.
 *
 * The platform owns these fields: each run overwrites them with what the database
 * says, so nobody should type in them by hand. No runtime imports, because the
 * environment schema reads the key list.
 */
import type { AccessLevel } from "@/lib/billing/accounts";

export interface CloseFacts {
  readonly signedUpAt: Date;
  readonly lastLoginAt: Date | null;
  readonly loginCount: number;
  /** Pays 2.400 instead of 4.800 (lib/billing/access isGrandfatheredPerson). */
  readonly grandfathered: boolean;
  /** The platform's own consent gate: follow-ups not switched off, no "all" opt-out. */
  readonly mayEmail: boolean;
  readonly freeMail: boolean;
  readonly ceoCourse: {
    readonly done: number;
    readonly total: number;
    readonly completedAt: Date | null;
  };
  /** The company the person has open, as the session resolves it; null without one. */
  readonly company: {
    readonly name: string;
    readonly sector: string;
    readonly employeeCount: number | null;
    readonly country: string | null;
    readonly actsAsSupplier: boolean;
  } | null;
  /** The access that company gives this person, as the session computes it. */
  readonly access: AccessLevel | null;
  /** That company's NIS 2 path. */
  readonly path: { readonly done: number; readonly total: number } | null;
}

export type CloseFieldValue = string | number | null;
export type CloseFieldLevel = "contact" | "lead";

/** Close date fields take a calendar day; ours are days in Berlin. */
const berlinDay = (date: Date): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(date);

const yesNo = (value: boolean): string => (value ? "Yes" : "No");

const percent = (done: number, total: number): number | null =>
  total > 0 ? Math.round((Math.min(done, total) / total) * 100) : null;

type Field = {
  readonly level: CloseFieldLevel;
  readonly value: (facts: CloseFacts) => CloseFieldValue;
};

/** One entry per Close field, in the order they are written; the comment is its Close type. */
export const CLOSE_FIELDS = {
  /** date */
  signedUp: { level: "contact", value: (f) => berlinDay(f.signedUpAt) },
  /** date */
  lastLogin: {
    level: "contact",
    value: (f) => (f.lastLoginAt ? berlinDay(f.lastLoginAt) : null),
  },
  /** number */
  logins: { level: "contact", value: (f) => f.loginCount },
  /** choices: Yes, No */
  grandfathered: { level: "contact", value: (f) => yesNo(f.grandfathered) },
  /** choices: Yes, No */
  mayEmail: { level: "contact", value: (f) => yesNo(f.mayEmail) },
  /** choices: Yes, No */
  freeMail: { level: "contact", value: (f) => yesNo(f.freeMail) },
  /** number, 0 to 100 */
  ceoCourseProgress: {
    level: "contact",
    value: (f) => percent(f.ceoCourse.done, f.ceoCourse.total),
  },
  /** date */
  ceoCourseCompleted: {
    level: "contact",
    value: (f) => (f.ceoCourse.completedAt ? berlinDay(f.ceoCourse.completedAt) : null),
  },
  /** text: free, grandfathered or full */
  access: { level: "contact", value: (f) => f.access },
  /** text */
  company: { level: "lead", value: (f) => f.company?.name ?? null },
  /** text */
  sector: { level: "lead", value: (f) => f.company?.sector ?? null },
  /** number */
  employees: { level: "lead", value: (f) => f.company?.employeeCount ?? null },
  /** text, two letters */
  country: { level: "lead", value: (f) => f.company?.country ?? null },
  /** choices: Yes, No */
  supplier: { level: "lead", value: (f) => yesNo(f.company?.actsAsSupplier ?? false) },
  /** number, 0 to 100 */
  pathProgress: {
    level: "lead",
    value: (f) => (f.path ? percent(f.path.done, f.path.total) : null),
  },
} as const satisfies Record<string, Field>;

export type CloseFieldKey = keyof typeof CLOSE_FIELDS;

export const CLOSE_FIELD_KEYS = Object.keys(CLOSE_FIELDS) as readonly CloseFieldKey[];

/** Written once, when the sync creates the lead, and never overwritten: sales may change it. */
export const LEAD_SOURCE = "Platform signup";

/** Close custom field id per key. A key without an id is not synced. */
export type CloseFieldIds = Partial<Record<CloseFieldKey | "leadSource", string>>;

/** Close request keys ("custom.cf_…") to values, per level. */
export type CloseFieldValues = {
  readonly contact: Readonly<Record<string, CloseFieldValue>>;
  readonly lead: Readonly<Record<string, CloseFieldValue>>;
};

/**
 * The configured fields, split by level, in registry order. A person with no open
 * company writes nothing to the lead: their empty company must not blank out what
 * a colleague, or sales, put there.
 */
export const closeFieldValues = (
  facts: CloseFacts,
  fieldIds: CloseFieldIds,
): CloseFieldValues => {
  const at = (level: CloseFieldLevel) =>
    Object.fromEntries(
      CLOSE_FIELD_KEYS.flatMap((key) => {
        const id = fieldIds[key];
        const field = CLOSE_FIELDS[key];
        return id && field.level === level ? [[`custom.${id}`, field.value(facts)]] : [];
      }),
    );
  return { contact: at("contact"), lead: facts.company ? at("lead") : {} };
};
