/**
 * What a saved intake answer may be, and how much of one is ever shown.
 *
 * intake.saveRequirementAnswers used to store any JSON under a known key. The
 * answers are rendered into the compliance report and the policy PDF and put
 * into the audit-readiness prompt, and react-pdf lays a document out
 * synchronously on the one app container, so a member who saved a few
 * megabytes of text and exported the report could take the platform down.
 *
 * Each answer is checked against the field its category schema defines, read
 * through the same introspection that renders the form: the type the input
 * produces and, for text, the schema's own maximum, which the input already
 * enforces with maxLength. Nothing typed into the form is refused.
 */
import { type FieldMeta, introspectSchema } from "@/lib/forms/schema-introspect";
import { CATEGORY_SCHEMAS } from "./category-schemas";

const FIELDS_BY_CATEGORY: ReadonlyMap<string, ReadonlyMap<string, FieldMeta>> = new Map(
  Object.entries(CATEGORY_SCHEMAS).map(([code, schema]) => [
    code,
    new Map(introspectSchema(schema, []).map((field) => [field.key, field])),
  ]),
);

/** The longest answer any intake field allows: 1,000 characters when this was written. */
export const LONGEST_INTAKE_ANSWER = Math.max(
  ...[...FIELDS_BY_CATEGORY.values()].flatMap((fields) =>
    [...fields.values()].map((field) => field.maxLength ?? 0),
  ),
);

/**
 * How much one save may carry, serialized. The largest category's text fields
 * add up to 2,620 characters and the largest single requirement's to 1,255, so
 * this sits more than ten times above anything the form can send. It exists to
 * turn away a payload of junk keys at input validation, before the handler
 * reads or writes anything.
 */
export const MAX_INTAKE_PAYLOAD_CHARS = 32_768;

/**
 * How much of one stored answer a document or prompt shows. Twice the longest
 * answer a save accepts, so a current answer is never cut: only rows written
 * before saves were checked can be longer, and those must not be able to blow
 * up a render either.
 */
export const SHOWN_ANSWER_CHARS = 2 * LONGEST_INTAKE_ANSWER;

/** An ISO timestamp is 24 characters; anything much longer is not a date. */
const DATE_TEXT_MAX = 40;

export function withinIntakePayloadCap(answers: Record<string, unknown>): boolean {
  try {
    return JSON.stringify(answers).length <= MAX_INTAKE_PAYLOAD_CHARS;
  } catch {
    // superjson can hand over a BigInt or a cycle, which JSON cannot store.
    return false;
  }
}

export type IntakeAnswersCheck =
  | { ok: true; answers: Record<string, unknown> }
  | { ok: false; message: string };

/**
 * Check one requirement's answers against its category's fields and keep only
 * that requirement's own keys, which are the only ones a save may write.
 */
export function checkRequirementAnswers(
  categoryCode: string,
  fieldKeys: readonly string[],
  answers: Record<string, unknown>,
): IntakeAnswersCheck {
  const fields = FIELDS_BY_CATEGORY.get(categoryCode);
  const entries = fieldKeys
    .filter((key) => answers[key] !== undefined)
    .map((key) => [key, answers[key]] as const);
  const refusals = entries.flatMap(([key, value]) => {
    const field = fields?.get(key);
    const problem = field ? problemWith(field, value) : "is not a field of this category";
    return problem ? [`${field?.label ?? key} ${problem}`] : [];
  });
  if (refusals.length > 0) return { ok: false, message: `${refusals.join("; ")}.` };
  return { ok: true, answers: Object.fromEntries(entries) };
}

/**
 * Why a value cannot be stored for a field, or null when it can. Number ranges
 * (a minimum password length of 8, a percentage up to 100) are not enforced:
 * they describe good practice, and refusing a truthful answer that falls short
 * of it would push people to record a false one.
 */
function problemWith(field: FieldMeta, value: unknown): string | null {
  // Both are how the form clears a field, and both read as unanswered.
  if (value === null || value === "") return null;
  switch (field.type) {
    case "text":
    case "textarea":
    case "email":
    case "url":
    case "file": {
      const max = field.maxLength ?? LONGEST_INTAKE_ANSWER;
      if (typeof value !== "string") return "must be text";
      return value.length > max ? `must be at most ${max} characters` : null;
    }
    case "enum":
      return typeof value === "string" && (field.options ?? []).includes(value)
        ? null
        : "must be one of the listed options";
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? null
        : "must be a number";
    case "boolean":
      return typeof value === "boolean" ? null : "must be yes or no";
    case "date":
      return isDateValue(value) ? null : "must be a date";
    case "array":
    case "unknown":
      return "cannot be saved from this form";
  }
}

/** The form sends a Date; an answer loaded back from the database is its ISO string. */
function isDateValue(value: unknown): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return (
    typeof value === "string" &&
    value.length <= DATE_TEXT_MAX &&
    !Number.isNaN(Date.parse(value))
  );
}

/** Cut a stored answer down to what a document or prompt shows. */
export function clipAnswer(text: string): string {
  if (text.length <= SHOWN_ANSWER_CHARS) return text;
  const cut = text.slice(0, SHOWN_ANSWER_CHARS);
  // Cutting between the halves of a surrogate pair leaves a character no font can draw.
  const last = cut.charCodeAt(cut.length - 1);
  const whole = last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
  return `${whole}…`;
}
