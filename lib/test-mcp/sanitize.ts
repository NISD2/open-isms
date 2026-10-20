import { UNPRINTABLE } from "@/lib/mcp/agent";

/**
 * What reaches the model. Everything people typed is untrusted text, so what could change how a
 * model reads it is taken out (control, format and bidi characters) and each string is capped.
 * Free text that explains an event (descriptions, stored values) also has every email address and
 * IP address in it masked, the one the operator asked about included: the operator already has
 * that person's address from the lookup, and a log entry has no use for it. Pure.
 */

/** The longest string of a result; a longer one is cut and says so. */
export const MAX_STRING_CHARS = 500;
/** The longest stored value shown whole; a longer one is shown as a cut preview. */
export const MAX_VALUE_CHARS = 1_500;
/** The longest description shown, before masking. */
export const MAX_DESCRIPTION_CHARS = 1_000;

const UNPRINTABLE_ALL = new RegExp(UNPRINTABLE.source, "gu");
// Every part has a length limit (an address is at most 64 + 255 characters), so a long run of
// characters with no "@" in it costs a bounded scan at each position, not a quadratic one.
const SEP = String.raw`\s@<>"'\x60,;()[\]{}\\`;
const EMAIL = new RegExp(
  `([^${SEP}])[^${SEP}]{0,63}@([^${SEP}]{1,253}\\.[^${SEP}]{1,253})`,
  "g",
);
const IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;
// Four or more groups, or a "::": a clock time (12:30:45) has two colons and is left alone.
const IPV6 =
  /(?<![0-9a-f:])(?:(?:[0-9a-f]{1,4}:){3,7}[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{0,4}::[0-9a-f:]*[0-9a-f])(?![0-9a-f:])/gi;

/** `anna.muster@example.org` as `a***@example.org`, an address as `[ip]`. */
export const maskPersonal = (text: string): string =>
  text.replace(EMAIL, "$1***@$2").replace(IPV4, "[ip]").replace(IPV6, "[ip]");

/** A description with its length bounded first, so masking never meets an unbounded text. */
export const shownDescription = (text: string): string =>
  maskPersonal(
    text.length > MAX_DESCRIPTION_CHARS
      ? `${text.slice(0, MAX_DESCRIPTION_CHARS)}…`
      : text,
  );

export const plain = (text: string): string => {
  const clean = text.replace(UNPRINTABLE_ALL, " ").trim();
  return clean.length > MAX_STRING_CHARS ? `${clean.slice(0, MAX_STRING_CHARS)}…` : clean;
};

/** For `JSON.stringify`: every string of the result passes through `plain`. */
export const cleanReplacer = (_key: string, value: unknown): unknown =>
  typeof value === "string" ? plain(value) : value;

/**
 * A stored value for a model: the value itself, masked, when its JSON is at most
 * MAX_VALUE_CHARS; a preview of its start with its full length when it is longer. Bounded before
 * it is masked. Each string inside still passes through `plain` when the result is serialised.
 */
export function shownValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  const raw = JSON.stringify(value);
  if (raw.length > MAX_VALUE_CHARS) {
    return {
      cut: true,
      totalChars: raw.length,
      preview: maskPersonal(raw.slice(0, MAX_STRING_CHARS)),
    };
  }
  const masked = maskPersonal(raw);
  try {
    return JSON.parse(masked);
  } catch {
    return masked;
  }
}
