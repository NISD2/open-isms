/**
 * Finding an email address in free text as a whole address.
 *
 * A bare substring match on the erased person's address rewrote other
 * people's: erasing anna@web.de turned hanna@web.de into "h[erased]",
 * susanna@web.de into "sus[erased]" and anna@web.de.example.org into
 * "[erased].example.org", in every tenant's audit rows, irreversibly. So an
 * occurrence counts only when the character before it could not continue the
 * local part and the character after it could not continue the domain.
 *
 * A character scan rather than a pattern over the text, so each boundary rule
 * is one readable function; a regex only classifies single characters.
 */

/**
 * What RFC 5322 allows in an unquoted local part besides letters and digits.
 * These continue an address, so o'anna@web.de, a real address shape, is not
 * anna@web.de.
 */
const LOCAL_PART_SYMBOLS = new Set("!#$%&'*+-/=?^_`{|}~.");

const isAsciiAlphanumeric = (code: number) =>
  (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);

/** Tests the Unicode category of one character, never the shape of a text. */
const LETTER_DIGIT_OR_MARK = /^[\p{L}\p{N}\p{M}]$/u;

/**
 * Beyond ASCII, only letters, digits and combining marks can belong to an
 * internationalized address. Quotes („“ «» ‘’), spaces of any width,
 * zero-width characters and an ellipsis cannot, so they are boundaries: the
 * erased person's own address stands between them in real text.
 */
function isAddressCharacter(ch: string, asciiSymbols: (ch: string) => boolean): boolean {
  const code = ch.codePointAt(0) ?? 0;
  if (code > 127) return LETTER_DIGIT_OR_MARK.test(ch);
  return isAsciiAlphanumeric(code) || asciiSymbols(ch);
}

function continuesLocalPart(ch: string | undefined): boolean {
  return ch !== undefined && isAddressCharacter(ch, (c) => LOCAL_PART_SYMBOLS.has(c));
}

function isDomainCharacter(ch: string | undefined): boolean {
  return ch !== undefined && isAddressCharacter(ch, (c) => c === "-");
}

/** The whole character starting at `at`, so a letter outside the BMP is read as one. */
function characterAt(text: string, at: number): string | undefined {
  const code = text.codePointAt(at);
  return code === undefined ? undefined : String.fromCodePoint(code);
}

/** The whole character ending just before `at`. */
function characterBefore(text: string, at: number): string | undefined {
  if (at <= 0) return undefined;
  const last = text.charCodeAt(at - 1);
  const isLowSurrogate = last >= 0xdc00 && last <= 0xdfff;
  return isLowSurrogate && at >= 2 ? text.slice(at - 2, at) : text[at - 1];
}

/** A dot continues the domain only when a label follows it, not at the end of a sentence. */
function continuesDomain(text: string, at: number): boolean {
  const next = characterAt(text, at);
  return (
    isDomainCharacter(next) ||
    (next === "." && isDomainCharacter(characterAt(text, at + 1)))
  );
}

/**
 * Lowercase without moving any character. A few characters lowercase to two
 * code units, which would shift every index after them; those keep their case.
 */
function foldCase(text: string): string {
  const lower = text.toLowerCase();
  if (lower.length === text.length) return lower;
  return [...text]
    .map((ch) => {
      const folded = ch.toLowerCase();
      return folded.length === ch.length ? folded : ch;
    })
    .join("");
}

/** Where the address stands in the text as a whole address, ignoring case, as [start, end) pairs. */
export function addressSpans(
  text: string,
  address: string,
): Array<readonly [number, number]> {
  const needle = foldCase(address.trim());
  if (!needle.includes("@")) return [];
  const haystack = foldCase(text);
  const spans: Array<readonly [number, number]> = [];
  // Scan cursor: past a whole match, or one character on after a partial one.
  let from = 0;
  for (
    let at = haystack.indexOf(needle);
    at !== -1;
    at = haystack.indexOf(needle, from)
  ) {
    const end = at + needle.length;
    const whole =
      !continuesLocalPart(characterBefore(haystack, at)) &&
      !continuesDomain(haystack, end);
    if (whole) spans.push([at, end]);
    from = whole ? end : at + 1;
  }
  return spans;
}

/** Replace every whole occurrence of the address, and nothing that merely contains it. */
export function replaceAddress(
  text: string,
  address: string,
  replacement: string,
): string {
  const spans = addressSpans(text, address);
  if (spans.length === 0) return text;
  const { out, last } = spans.reduce(
    (acc, [start, end]) => ({
      out: acc.out + text.slice(acc.last, start) + replacement,
      last: end,
    }),
    { out: "", last: 0 },
  );
  return out + text.slice(last);
}

/** Whether any string inside a JSON value holds the address as a whole address. */
export function mentionsAddress(value: unknown, address: string): boolean {
  if (typeof value === "string") return addressSpans(value, address).length > 0;
  if (Array.isArray(value)) return value.some((v) => mentionsAddress(v, address));
  if (value && typeof value === "object") {
    return Object.values(value).some((v) => mentionsAddress(v, address));
  }
  return false;
}
