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
import type { vatTreatmentEnum } from "@nisd2/isms-schema";

/** Our own VAT number, sent so the response carries a consultation number. */
export interface ViesRequester {
  readonly memberStateCode: string;
  readonly number: string;
}

export interface ViesConfig {
  readonly endpoint: string;
  /** Null when our own VAT number is not set. */
  readonly requester: ViesRequester | null;
}

/** The settings the check needs, as the validated environment provides them. */
export interface ViesEnv {
  readonly OWN_VAT_NUMBER?: string | undefined;
  readonly VIES_ENDPOINT: string;
}

/**
 * Builds the check's config from the validated environment.
 *
 * Our own number is read by the same splitter as a customer's, so it gets the same normalisation
 * and the same checks, and its own prefix decides its country. A number that cannot be read is
 * sent as no requester at all rather than as a wrong one: without a requester every check still
 * works and only the consultation number is missing, whereas a requester VIES rejects would turn
 * every check into "unavailable" and silently put domestic VAT on every EU customer.
 */
export const viesConfigFromEnv = (env: ViesEnv): ViesConfig => {
  const own = env.OWN_VAT_NUMBER ? splitVatNumber(env.OWN_VAT_NUMBER) : null;
  return {
    endpoint: env.VIES_ENDPOINT,
    requester: own ? { memberStateCode: own.countryCode, number: own.vatNumber } : null,
  };
};

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
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "EL",
  "ES",
  "FI",
  "FR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  "XI",
]);

/**
 * A VAT number as the user typed it, split into the two parts VIES wants.
 * "DE 123456789", "de123456789" and "DE123456789" all mean the same thing.
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
  | {
      readonly status: "invalid";
      readonly countryCode: string;
      readonly vatNumber: string;
      readonly checkedAt: string;
    }
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
  /** VIES answers failures with this shape instead of a validity, e.g. MS_UNAVAILABLE. */
  readonly actionSucceed?: unknown;
  readonly errorWrappers?: unknown;
}

/**
 * VIES reports a failure as `{actionSucceed: false, errorWrappers: [{error: "MS_UNAVAILABLE"}]}`
 * rather than as an HTTP error, so the code has to be dug out. MS_UNAVAILABLE means that member
 * state's own register is down, which is common and says nothing about the number; INVALID_INPUT
 * means the number is malformed. Surfacing the code matters because "we could not check" and
 * "that is not a number" need different words in front of a customer.
 */
const errorCode = (d: ViesResponse): string | null => {
  if (!Array.isArray(d.errorWrappers)) return null;
  for (const w of d.errorWrappers) {
    if (typeof w === "object" && w !== null) {
      const e = (w as { error?: unknown }).error;
      if (typeof e === "string" && e) return e;
    }
  }
  return null;
};

/**
 * Check one VAT number. Never throws: every failure path returns "unavailable", because this is a
 * free third-party service on the path to taking money and it must not be able to stop a sale.
 */
export const checkVatNumber = async (
  input: string,
  config: ViesConfig,
  signal?: AbortSignal,
): Promise<VatCheck> => {
  const parts = splitVatNumber(input);
  if (!parts) return { status: "malformed" };

  // Without the requester the consultation number comes back empty, and the consultation number is
  // the only part of this with legal weight.
  const body = {
    countryCode: parts.countryCode,
    vatNumber: parts.vatNumber,
    ...(config.requester
      ? {
          requesterMemberStateCode: config.requester.memberStateCode,
          requesterNumber: config.requester.number,
        }
      : {}),
  };

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const merged = signal ? AbortSignal.any([signal, timeout]) : timeout;

  const res = await fetch(config.endpoint, {
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
  const code = errorCode(d);
  if (code) {
    // INVALID_INPUT is about the number, everything else is about their service. Both are
    // "unavailable" to the caller, because neither is a statement that the number is not
    // registered, and only VIES can make that statement.
    return { status: "unavailable", reason: code };
  }
  if (typeof d.valid !== "boolean")
    return { status: "unavailable", reason: "no validity in response" };

  const checkedAt = clean(d.requestDate) ?? new Date().toISOString();
  if (!d.valid) {
    return {
      status: "invalid",
      countryCode: parts.countryCode,
      vatNumber: parts.vatNumber,
      checkedAt,
    };
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
 * One attempt at checking a number, in the shape it is stored in.
 *
 * **Every attempt is recorded, including the ones that failed**, because an unavailable register
 * is a fact about that date rather than an absence of work. This is the same principle the product
 * itself sells about § 30 Abs. 1 Satz 3: where the answer cannot be had, record the diligence
 * rather than claim the answer or leave a blank.
 *
 * The consultation number is the part with legal weight. An auditor asking whether a customer's
 * VAT number was verified before a reverse-charge invoice wants this trail, and a trail that
 * includes "the register was down at 21:14 and answered at 09:02 the next morning" is a better
 * answer than a tick with no history behind it.
 */
export interface VatCheckAttempt {
  readonly vatNumberGiven: string;
  readonly outcome: VatCheck["status"];
  /** The Commission's receipt, when they gave one. Null on every other outcome. */
  readonly consultationNumber: string | null;
  /** Their own error code where there was one, e.g. MS_UNAVAILABLE. */
  readonly detail: string | null;
  readonly attemptedAt: string;
}

/** Turn a result into the row that gets stored. Total: every outcome produces a record. */
export const toAttempt = (vatNumberGiven: string, check: VatCheck): VatCheckAttempt => {
  const attemptedAt = new Date().toISOString();
  switch (check.status) {
    case "valid":
      return {
        vatNumberGiven,
        outcome: "valid",
        consultationNumber: check.consultationNumber,
        detail: null,
        attemptedAt: check.checkedAt,
      };
    case "invalid":
      return {
        vatNumberGiven,
        outcome: "invalid",
        consultationNumber: null,
        detail: null,
        attemptedAt: check.checkedAt,
      };
    case "unavailable":
      return {
        vatNumberGiven,
        outcome: "unavailable",
        consultationNumber: null,
        detail: check.reason,
        attemptedAt,
      };
    case "malformed":
      return {
        vatNumberGiven,
        outcome: "malformed",
        consultationNumber: null,
        detail: null,
        attemptedAt,
      };
  }
};

/** An attempt still worth repeating: only an outage, never a settled answer. */
export const shouldRetry = (a: VatCheckAttempt): boolean => a.outcome === "unavailable";

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
/**
 * The four outcomes come from the database enum that stores them on an invoice, so a treatment the
 * database cannot hold does not compile: `Extract` of a kind the enum lacks is `never`.
 */
type TreatmentKind = (typeof vatTreatmentEnum.enumValues)[number];

export type VatTreatment =
  | { readonly kind: Extract<TreatmentKind, "domestic">; readonly rate: number }
  | {
      readonly kind: Extract<TreatmentKind, "reverse_charge">;
      readonly rate: 0;
      readonly note: string;
    }
  | {
      readonly kind: Extract<TreatmentKind, "unconfirmed_eu">;
      readonly rate: number;
      readonly why: string;
    }
  | {
      readonly kind: Extract<TreatmentKind, "outside_eu">;
      readonly rate: 0;
      readonly note: string;
    };

/**
 * Where reverse charge can apply to what we sell, which is a service. EL and GR are both accepted
 * for Greece, because the VAT prefix and the ISO code differ and a caller may pass either.
 *
 * XI, Northern Ireland, is deliberately absent. Under the Windsor Framework it stays inside the EU
 * VAT area for goods only; a service to a Northern Irish business follows UK rules, so it is treated
 * like any other customer outside the EU. VIES still validates XI numbers, which is why XI remains
 * a valid prefix for the check itself.
 */
const EU = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "EL",
  "GR",
  "ES",
  "FI",
  "FR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
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
