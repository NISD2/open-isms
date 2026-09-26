/**
 * IBAN validation, ISO 13616 mod-97.
 *
 * Needed for a reason that only showed up against the real API: Qonto's sandbox returns a **masked**
 * IBAN on the main account, literally containing X characters, and their own invoice endpoint then
 * rejects it. Picking "the first account that has an iban" is therefore not the same as picking one
 * that works, and the difference is a 422 at the moment you try to bill someone.
 *
 * It is worth having beyond that quirk: the IBAN is printed on every invoice as the account to pay
 * into, and a wrong one is the most expensive typo available to us.
 */

const LENGTHS: Readonly<Record<string, number>> = {
  AT: 20,
  BE: 16,
  BG: 22,
  CH: 21,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  EE: 20,
  ES: 24,
  FI: 18,
  FR: 27,
  GB: 22,
  GR: 27,
  HR: 21,
  HU: 28,
  IE: 22,
  IT: 27,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  MT: 31,
  NL: 18,
  NO: 15,
  PL: 28,
  PT: 25,
  RO: 24,
  SE: 24,
  SI: 19,
  SK: 24,
};

export const normaliseIban = (iban: string): string =>
  iban.replace(/\s+/g, "").toUpperCase();

/**
 * The mod-97 check from ISO 13616: move the first four characters to the end, map letters to
 * numbers, and the whole thing mod 97 must be 1. Done in chunks because the number is far larger
 * than a JavaScript integer can hold.
 */
const mod97 = (rearranged: string): number => {
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const value =
      code >= 48 && code <= 57
        ? ch // a digit
        : code >= 65 && code <= 90
          ? String(code - 55) // A=10 … Z=35
          : null;
    if (value === null) return Number.NaN;
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder;
};

/** True only for an IBAN that is well formed for its country and passes the checksum. */
export const isValidIban = (input: string): boolean => {
  const iban = normaliseIban(input);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;
  const country = iban.slice(0, 2);
  const expected = LENGTHS[country];
  // An unknown country is not rejected outright: the list above is not exhaustive and the checksum
  // still has to pass. A known country with the wrong length is rejected.
  if (expected !== undefined && iban.length !== expected) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  return mod97(rearranged) === 1;
};

/** For display: grouped in fours, which is how a person reads one back to check it. */
export const formatIban = (input: string): string =>
  normaliseIban(input)
    .replace(/(.{4})/g, "$1 ")
    .trim();

export interface AccountLike {
  readonly iban?: string;
  readonly name?: string;
  readonly status?: string;
}

/**
 * Choose the account an invoice should be paid into.
 *
 * Preference order: an active account with a valid IBAN, then any account with a valid IBAN. An
 * account whose IBAN does not validate is never chosen, which is what stops the sandbox's masked
 * placeholder reaching the invoice endpoint.
 */
export const pickPayableAccount = <T extends AccountLike>(
  accounts: readonly T[],
): T | null => {
  const usable = accounts.filter((a) => a.iban && isValidIban(a.iban));
  return usable.find((a) => a.status === "active") ?? usable[0] ?? null;
};
