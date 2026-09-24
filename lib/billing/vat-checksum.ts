/**
 * Offline structural validation of a VAT identification number.
 *
 * This exists because VIES cannot be relied on. On 24.09.2026 the German member-state service
 * returned MS_UNAVAILABLE for twenty minutes straight, for every number including a known-good
 * control, **while the VIES status endpoint reported Germany as Available**. A free service with
 * no service level agreement, whose own health endpoint disagrees with its behaviour, is not
 * something to put in front of a customer filling in a form.
 *
 * So the roles are split:
 *
 *   - **this module validates the form.** Instant, offline, deterministic, and it catches the
 *     failure that actually happens, which is a typo. It works when VIES is down, which is now
 *     known to be a normal condition rather than an edge case.
 *   - **VIES runs behind it**, asynchronously and with retries, for the one thing only it can give:
 *     the consultation number that evidences a reverse-charge decision.
 *
 * Structure is not registration. A number can be perfectly formed and belong to nobody. This says
 * "that is not a typo", never "that company exists".
 */

/** Per-country length and alphabet, the first gate before any arithmetic. */
const FORMATS: Readonly<Record<string, RegExp>> = {
  AT: /^U[0-9]{8}$/,
  BE: /^[01][0-9]{9}$/,
  BG: /^[0-9]{9,10}$/,
  CY: /^[0-9]{8}[A-Z]$/,
  CZ: /^[0-9]{8,10}$/,
  DE: /^[0-9]{9}$/,
  DK: /^[0-9]{8}$/,
  EE: /^[0-9]{9}$/,
  EL: /^[0-9]{9}$/,
  ES: /^[A-Z0-9][0-9]{7}[A-Z0-9]$/,
  FI: /^[0-9]{8}$/,
  FR: /^[A-Z0-9]{2}[0-9]{9}$/,
  HR: /^[0-9]{11}$/,
  HU: /^[0-9]{8}$/,
  IE: /^([0-9]{7}[A-Z]{1,2}|[0-9][A-Z*+][0-9]{5}[A-Z])$/,
  IT: /^[0-9]{11}$/,
  LT: /^([0-9]{9}|[0-9]{12})$/,
  LU: /^[0-9]{8}$/,
  LV: /^[0-9]{11}$/,
  MT: /^[0-9]{8}$/,
  NL: /^[0-9]{9}B[0-9]{2}$/,
  PL: /^[0-9]{10}$/,
  PT: /^[0-9]{9}$/,
  RO: /^[0-9]{2,10}$/,
  SE: /^[0-9]{12}$/,
  SI: /^[0-9]{8}$/,
  SK: /^[0-9]{10}$/,
  XI: /^([0-9]{9}|[0-9]{12}|(GD|HA)[0-9]{3})$/,
};

/**
 * The German check digit, ISO 7064 MOD 11,10. The ninth digit is derived from the first eight.
 *
 * Verified against three published German numbers, and against a deliberately corrupted one that
 * it correctly rejects. Germany is implemented because it is the only country that matters for
 * this product today; the others are format-checked only, and saying so is better than pretending
 * to a rigour we have not implemented.
 */
const germanCheckDigit = (digits: string): number => {
  let p = 10;
  for (const ch of digits.slice(0, 8)) {
    const m = (p + Number(ch)) % 10 || 10;
    p = (2 * m) % 11;
  }
  const c = 11 - p;
  return c === 10 ? 0 : c;
};

export type StructuralCheck =
  /** Not even the right shape for that country, or the country is not one that issues VAT numbers. */
  | { readonly ok: false; readonly reason: "format"; readonly countryCode: string }
  /** The right shape, but the check digit does not match. Almost always a typo. */
  | { readonly ok: false; readonly reason: "checksum"; readonly countryCode: string }
  /** Structurally sound. Says nothing about whether it is registered or whose it is. */
  | {
      readonly ok: true;
      readonly countryCode: string;
      readonly verified: "checksum" | "format_only";
    };

/**
 * Validate the structure of a VAT number that has already been split into country and number.
 * Never touches the network.
 */
export const checkStructure = (
  countryCode: string,
  vatNumber: string,
): StructuralCheck => {
  const cc = countryCode.toUpperCase();
  const n = vatNumber.toUpperCase();
  const format = FORMATS[cc];
  if (!format || !format.test(n)) return { ok: false, reason: "format", countryCode: cc };

  if (cc === "DE") {
    const expected = germanCheckDigit(n);
    const actual = Number(n[8]);
    if (expected !== actual) return { ok: false, reason: "checksum", countryCode: cc };
    return { ok: true, countryCode: cc, verified: "checksum" };
  }

  // Every other member state has its own algorithm. Until one is needed, say what was actually
  // checked rather than implying a check that did not happen.
  return { ok: true, countryCode: cc, verified: "format_only" };
};

/** What to show a person, given a structural result. Never accusatory: a typo is not a crime. */
export const structuralMessage = (r: StructuralCheck): string | null => {
  if (r.ok) return null;
  return r.reason === "format"
    ? "That does not look like a VAT identification number for that country. Check the country prefix and the length."
    : "That number has a digit wrong somewhere. Check it against your tax office letter or an invoice you have issued.";
};
