/**
 * VAT identification number validation against VIES, the European Commission's register.
 *
 * Why this exists, and what it is NOT for. A German invoice must carry the recipient's correct
 * legal name and address to be valid under § 14 UStG, and a customer holding a wrong invoice
 * cannot book the cost. Checking the number before the invoice is issued saves them a correction
 * and us a credit note. It is not fraud protection and must never behave like it: an invalid
 * number warns and lets them continue, and an outage is invisible.
 *
 * TESTED LIVE 24.09.2026, and the result corrected the design:
 *
 *   - **Germany does not disclose the name or address.** A valid German number returns
 *     `name: "---"`, and supplying a name to ask for a match returns NOT_PROCESSED on every match
 *     field. So for the customers this product will actually have, VIES confirms the number exists
 *     and nothing more. Autofill works only for the member states that disclose.
 *   - **The valuable part is the consultation number.** Passing our own VAT number as the requester
 *     returns a `requestIdentifier`, which is the Commission's receipt that we checked this number
 *     on this date. That is the evidence a supplier keeps to justify treating a sale as reverse
 *     charge, so the requester fields are not optional for us.
 *
 * No API key, no account, no rate-limit documented. Free service, so treat it as best-effort.
 */

/** Our own VAT number, sent as the requester so the response carries a consultation number. */
const REQUESTER = {
  memberStateCode: process.env.OWN_VAT_COUNTRY ?? "DE",
  number: process.env.OWN_VAT_NUMBER ?? "",
} as const;

const ENDPOINT =
  process.env.VIES_ENDPOINT ??
  "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

const TIMEOUT_MS = 6_000;

/** VIES writes three dashes where a member state declines to disclose. Germany always does. */
const WITHHELD = "---";

const clean = (s: unknown): string | null => {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t === "" || t === WITHHELD ? null : t;
};

/**
 * The country prefixes a VAT identification number can start with. Not the ISO country list:
 * Greece uses EL rather than GR, and Northern Ireland uses XI under the Windsor Framework.
 *
 * Checking against this list is not pedantry. Without it "hello" parses as country HE with number
 * LLO and goes to the network, which is exactly what the tests caught.
 */
const VAT_PREFIXES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE",
  "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "XI",
]);

/**
 * A VAT number as the user typed it, split into the two parts VIES wants.
 * "DE 811569869", "de811569869" and "DE811569869" all mean the same thing.
 *
 * The number part must contain at least one digit: every member state's format does, and requiring
 * it stops a word being mistaken for a VAT number when its first two letters happen to be a
 * country code.
 */
export const splitVatNumber = (
  input: string,
): { readonly countryCode: string; readonly vatNumber: string } | null => {
  const compact = input.replace(/[\s.\-/]/g, "").toUpperCase();
  const m = /^([A-Z]{2})([0-9A-Z]{2,14})$/.exec(compact);
  const countryCode = m?.[1];
  const vatNumber = m?.[2];
  if (!countryCode || !vatNumber) return null;
  if (!VAT_PREFIXES.has(countryCode)) return null;
  if (!/[0-9]/.test(vatNumber)) return null;
  return { countryCode, vatNumber };
};

/**
 * The outcome of a check. A discriminated union, so a caller cannot read `name` off a result that
 * has no name, and cannot treat an outage as an invalid number.
 */
export type VatCheck =
  /** The number does not even have the shape of a VAT identification number. */
  | { readonly status: "malformed" }
  /** VIES answered and the number is registered. Name and address only where the state discloses. */
  | {
      readonly status: "valid";
      readonly countryCode: string;
      readonly vatNumber: string;
      readonly name: string | null;
      readonly address: string | null;
      /** The Commission's receipt that we checked. Present only when our own number is configured. */
      readonly consultationNumber: string | null;
      readonly checkedAt: string;
    }
  /** VIES answered and the number is not registered. Warn, do not block. */
  | { readonly status: "invalid"; readonly countryCode: string; readonly vatNumber: string; readonly checkedAt: string }
  /** VIES did not answer, or answered badly. Invisible to the customer; the invoice still goes out. */
  | { readonly status: "unavailable"; readonly reason: string };

/** Narrowing helper, so callers do not repeat the string literal. */
export const isConfirmed = (c: VatCheck): c is Extract<VatCheck, { status: "valid" }> =>
  c.status === "valid";

interface ViesResponse {
  readonly valid?: unknown;
  readonly name?: unknown;
  readonly address?: unknown;
  readonly requestIdentifier?: unknown;
  readonly requestDate?: unknown;
}

/**
 * Check one VAT number. Never throws: every failure path returns "unavailable", because this is a
 * free third-party service on the path to taking money and it must not be able to stop a sale.
 */
export const checkVatNumber = async (input: string, signal?: AbortSignal): Promise<VatCheck> => {
  const parts = splitVatNumber(input);
  if (!parts) return { status: "malformed" };

  const body: Record<string, string> = {
    countryCode: parts.countryCode,
    vatNumber: parts.vatNumber,
  };
  // Without these the consultation number comes back empty, and the consultation number is the
  // only part of this with legal weight.
  if (REQUESTER.number) {
    body.requesterMemberStateCode = REQUESTER.memberStateCode;
    body.requesterNumber = REQUESTER.number;
  }

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const merged = signal ? AbortSignal.any([signal, timeout]) : timeout;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    signal: merged,
  }).catch((e: unknown) => (e instanceof Error ? e : new Error(String(e))));

  if (res instanceof Error) return { status: "unavailable", reason: res.message };
  if (!res.ok) return { status: "unavailable", reason: `HTTP ${res.status}` };

  const json: unknown = await res.json().catch(() => null);
  if (typeof json !== "object" || json === null) {
    return { status: "unavailable", reason: "response was not an object" };
  }
  const d = json as ViesResponse;
  if (typeof d.valid !== "boolean") return { status: "unavailable", reason: "no validity in response" };

  const checkedAt = clean(d.requestDate) ?? new Date().toISOString();
  if (!d.valid) {
    return { status: "invalid", countryCode: parts.countryCode, vatNumber: parts.vatNumber, checkedAt };
  }
  return {
    status: "valid",
    countryCode: parts.countryCode,
    vatNumber: parts.vatNumber,
    name: clean(d.name),
    address: clean(d.address),
    consultationNumber: clean(d.requestIdentifier),
    checkedAt,
  };
};

/**
 * Which value-added tax treatment an invoice gets, from the customer's country.
 *
 * German customers are invoiced with German VAT. A business elsewhere in the EU with a number VIES
 * confirms is reverse charged, and the invoice must say so. An unconfirmed number does NOT get
 * reverse charge, because the confirmation is what justifies it.
 *
 * `[The rates and the reverse-charge rule are recalled; confirm both with the Steuerberater before
 * the first cross-border invoice.]`
 */
export type VatTreatment =
  | { readonly kind: "domestic"; readonly rate: number }
  | { readonly kind: "reverse_charge"; readonly rate: 0; readonly note: string }
  | { readonly kind: "unconfirmed_eu"; readonly rate: number; readonly why: string }
  | { readonly kind: "outside_eu"; readonly rate: 0; readonly note: string };

/**
 * Where reverse charge can apply. EL and GR are both accepted for Greece, because the VAT prefix
 * and the ISO code differ and a caller may pass either. XI is Northern Ireland, which stays inside
 * the EU VAT area for goods under the Windsor Framework `[recalled; irrelevant for a service like
 * ours, kept so the set is not silently wrong]`.
 */
const EU = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "GR", "ES", "FI", "FR", "HR", "HU", "IE",
  "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "XI",
]);

const DOMESTIC_RATE = 0.19;

export const vatTreatment = (countryCode: string, check: VatCheck): VatTreatment => {
  const cc = countryCode.toUpperCase();
  if (cc === "DE") return { kind: "domestic", rate: DOMESTIC_RATE };
  if (!EU.has(cc)) {
    return {
      kind: "outside_eu",
      rate: 0,
      note: "Nicht steuerbare sonstige Leistung im Inland, Leistungsort im Ausland.",
    };
  }
  if (isConfirmed(check)) {
    return {
      kind: "reverse_charge",
      rate: 0,
      note: "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge).",
    };
  }
  return {
    kind: "unconfirmed_eu",
    rate: DOMESTIC_RATE,
    why: "Reverse charge requires a VAT number confirmed by VIES; this one is not confirmed, so the invoice carries domestic VAT.",
  };
};
