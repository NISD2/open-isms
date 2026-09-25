/**
 * VAT check tests.
 *
 * The pure parts are enumerated. The network call is tested against a stubbed fetch, including the
 * exact response shape VIES returned when this was tested live on 24.09.2026, so the German
 * "no name disclosed" behaviour is pinned rather than remembered.
 *
 * There is one live test, skipped by default. Run it with VIES_LIVE=1 when you want to know
 * whether the Commission has changed anything under us.
 */
import { afterEach, describe, expect, test } from "bun:test";
import {
  checkVatNumber,
  isConfirmed,
  shouldRetry,
  splitVatNumber,
  toAttempt,
  type VatCheck,
  VIES_DEFAULT_ENDPOINT,
  vatTreatment,
  viesConfigFromEnv,
} from "./vies";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Every stubbed check goes through one config; fetch is replaced, so the endpoint is never hit. */
const STUB_CONFIG = { endpoint: "https://vies.invalid/check", requester: null } as const;
const check = (input: string) => checkVatNumber(input, STUB_CONFIG);

describe("viesConfigFromEnv", () => {
  test("accepts our own number with its prefix and spacing, and sends it bare", () => {
    for (const own of ["DE 123 456 788", "de123456788", "123456788", "DE-123.456.788"]) {
      expect(
        viesConfigFromEnv({
          OWN_VAT_COUNTRY: "DE",
          OWN_VAT_NUMBER: own,
          VIES_ENDPOINT: VIES_DEFAULT_ENDPOINT,
        }).requester,
      ).toEqual({ memberStateCode: "DE", number: "123456788" });
    }
  });

  test("sends no requester when our own number is not set", () => {
    expect(
      viesConfigFromEnv({ OWN_VAT_COUNTRY: "DE", VIES_ENDPOINT: VIES_DEFAULT_ENDPOINT })
        .requester,
    ).toBeNull();
  });
});

/** The body VIES actually returned for a valid German number, recorded live. */
const GERMAN_VALID = {
  countryCode: "DE",
  vatNumber: "123456788",
  requestDate: "2026-09-24T20:51:04.673Z",
  valid: true,
  requestIdentifier: "",
  name: "---",
  address: "---",
  traderName: "---",
  traderNameMatch: "NOT_PROCESSED",
};

const stub = (body: unknown, ok = true, status = 200): void => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
  if (!ok) {
    globalThis.fetch = (async () => new Response("nope", { status })) as typeof fetch;
  }
};

describe("splitVatNumber", () => {
  test("accepts the ways a person actually types it", () => {
    for (const s of ["DE123456788", "de123456788", "DE 123 456 788", " DE-123456788 "]) {
      expect(splitVatNumber(s)).toEqual({ countryCode: "DE", vatNumber: "123456788" });
    }
  });

  test("rejects what is not a VAT number", () => {
    for (const s of ["", "123456788", "D123456788", "DE"]) {
      expect(splitVatNumber(s)).toBeNull();
    }
  });

  test("a word whose first two letters look like a country code is not a VAT number", () => {
    // "hello" uppercases to HELLO, which a naive split reads as country HE, number LLO. Caught by
    // these tests before it could send a word to the Commission.
    for (const s of ["hello", "nonsense", "ITEM", "ateam"]) {
      expect(splitVatNumber(s)).toBeNull();
    }
  });

  test("Greece is EL and Northern Ireland is XI, which are not their ISO codes", () => {
    expect(splitVatNumber("EL123456789")).toEqual({
      countryCode: "EL",
      vatNumber: "123456789",
    });
    expect(splitVatNumber("XI123456789")).toEqual({
      countryCode: "XI",
      vatNumber: "123456789",
    });
  });

  test("letters are allowed inside the number, as several member states use them", () => {
    expect(splitVatNumber("NL123456789B01")).toEqual({
      countryCode: "NL",
      vatNumber: "123456789B01",
    });
    expect(splitVatNumber("IE1234567FA")).toEqual({
      countryCode: "IE",
      vatNumber: "1234567FA",
    });
  });
});

describe("checkVatNumber", () => {
  test("malformed input never reaches the network", async () => {
    globalThis.fetch = (async () => {
      throw new Error("should not be called");
    }) as typeof fetch;
    expect(await check("nonsense")).toEqual({ status: "malformed" });
  });

  test("a valid German number is confirmed, and its withheld name becomes null rather than '---'", async () => {
    stub(GERMAN_VALID);
    const r = await check("DE123456788");
    expect(r.status).toBe("valid");
    if (!isConfirmed(r)) throw new Error("expected valid");
    // Germany does not disclose. The dashes must never reach a form field or an invoice.
    expect(r.name).toBeNull();
    expect(r.address).toBeNull();
    expect(r.consultationNumber).toBeNull();
    expect(r.checkedAt).toBe("2026-09-24T20:51:04.673Z");
  });

  test("a member state that does disclose fills name and address", async () => {
    stub({
      ...GERMAN_VALID,
      countryCode: "NL",
      name: "Voorbeeld B.V.",
      address: "Damrak 1, Amsterdam",
    });
    const r = await check("NL123456789B01");
    if (!isConfirmed(r)) throw new Error("expected valid");
    expect(r.name).toBe("Voorbeeld B.V.");
    expect(r.address).toBe("Damrak 1, Amsterdam");
  });

  test("the consultation number is kept when VIES returns one", async () => {
    stub({ ...GERMAN_VALID, requestIdentifier: "WAPIAAAAaDVL-xnd" });
    const r = await check("DE123456788");
    if (!isConfirmed(r)) throw new Error("expected valid");
    expect(r.consultationNumber).toBe("WAPIAAAAaDVL-xnd");
  });

  test("an unregistered number is invalid, not an outage", async () => {
    stub({ ...GERMAN_VALID, vatNumber: "000000000", valid: false });
    expect((await check("DE000000000")).status).toBe("invalid");
  });

  test("every failure is an outage, and nothing throws", async () => {
    stub(null, false, 503);
    expect((await check("DE123456788")).status).toBe("unavailable");

    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;
    const r = await check("DE123456788");
    expect(r.status).toBe("unavailable");
    if (r.status !== "unavailable") throw new Error("unreachable");
    expect(r.reason).toContain("network down");

    stub({ noValidityHere: true });
    expect((await check("DE123456788")).status).toBe("unavailable");
  });
});

describe("vatTreatment", () => {
  const confirmed: VatCheck = {
    status: "valid",
    countryCode: "NL",
    vatNumber: "123456789B01",
    name: null,
    address: null,
    consultationNumber: "WAPIAAAAaDVL-xnd",
    checkedAt: "2026-09-24T00:00:00.000Z",
  };
  const unavailable: VatCheck = { status: "unavailable", reason: "timeout" };

  test("a German customer is invoiced with German VAT whatever the check said", () => {
    expect(vatTreatment("DE", confirmed)).toEqual({ kind: "domestic", rate: 0.19 });
    expect(vatTreatment("DE", unavailable)).toEqual({ kind: "domestic", rate: 0.19 });
  });

  test("reverse charge needs a CONFIRMED number, not merely an EU country", () => {
    expect(vatTreatment("NL", confirmed).kind).toBe("reverse_charge");
    // This is the one that would quietly cost money: an unchecked number is not a licence to
    // zero-rate, because the confirmation is what justifies the zero rate.
    const guessed = vatTreatment("NL", unavailable);
    expect(guessed.kind).toBe("unconfirmed_eu");
    expect(guessed.rate).toBe(0.19);
  });

  test("outside the EU is out of scope and carries no German VAT", () => {
    expect(vatTreatment("CH", confirmed)).toMatchObject({ kind: "outside_eu", rate: 0 });
    // Northern Ireland is in the EU VAT area for goods only; a service follows UK rules.
    expect(vatTreatment("XI", confirmed)).toMatchObject({ kind: "outside_eu", rate: 0 });
    expect(vatTreatment("US", unavailable)).toMatchObject({
      kind: "outside_eu",
      rate: 0,
    });
  });

  test("every reverse-charge or out-of-scope treatment carries the wording the invoice needs", () => {
    const rc = vatTreatment("NL", confirmed);
    if (rc.kind !== "reverse_charge") throw new Error("expected reverse charge");
    expect(rc.note).toContain("Reverse Charge");
    const out = vatTreatment("CH", confirmed);
    if (out.kind !== "outside_eu") throw new Error("expected outside EU");
    expect(out.note.length).toBeGreaterThan(10);
  });
});

// The live check needs a VAT number that is really registered, and none is kept in the repository.
// Run it with VIES_LIVE=1 and VIES_LIVE_NUMBER set to a German number you know is valid.
const LIVE_NUMBER = process.env.VIES_LIVE_NUMBER ?? "";

describe("live check against the Commission (VIES_LIVE=1 and VIES_LIVE_NUMBER to run)", () => {
  test.skipIf(process.env.VIES_LIVE !== "1" || !LIVE_NUMBER)(
    "a known-valid German number still validates and still withholds the name",
    async () => {
      const r = await checkVatNumber(
        LIVE_NUMBER,
        viesConfigFromEnv({
          OWN_VAT_COUNTRY: process.env.OWN_VAT_COUNTRY ?? "DE",
          OWN_VAT_NUMBER: process.env.OWN_VAT_NUMBER,
          VIES_ENDPOINT: VIES_DEFAULT_ENDPOINT,
        }),
      );
      expect(r.status).toBe("valid");
      if (!isConfirmed(r)) throw new Error("expected valid");
      // If this ever starts returning a name, the autofill design can be revisited.
      expect(r.name).toBeNull();
    },
  );
});

describe("the attempt log, which is the part with legal weight", () => {
  test("every outcome produces a record, including the failures", async () => {
    const cases: readonly VatCheck[] = [
      {
        status: "valid",
        countryCode: "DE",
        vatNumber: "345678906",
        name: null,
        address: null,
        consultationNumber: "WAPIAAAAaDVL-xnd",
        checkedAt: "2026-09-24T21:00:00.000Z",
      },
      {
        status: "invalid",
        countryCode: "DE",
        vatNumber: "000000000",
        checkedAt: "2026-09-24T21:00:00.000Z",
      },
      { status: "unavailable", reason: "MS_UNAVAILABLE" },
      { status: "malformed" },
    ];
    for (const c of cases) {
      const a = toAttempt("DE345678906", c);
      expect(a.outcome).toBe(c.status);
      expect(typeof a.attemptedAt).toBe("string");
      expect(a.attemptedAt.length).toBeGreaterThan(10);
    }
  });

  test("the consultation number survives only where the Commission issued one", () => {
    const withNumber = toAttempt("DE345678906", {
      status: "valid",
      countryCode: "DE",
      vatNumber: "345678906",
      name: null,
      address: null,
      consultationNumber: "WAPIAAAAaDVL-xnd",
      checkedAt: "2026-09-24T21:00:00.000Z",
    });
    expect(withNumber.consultationNumber).toBe("WAPIAAAAaDVL-xnd");
    expect(
      toAttempt("DE1", { status: "unavailable", reason: "MS_UNAVAILABLE" })
        .consultationNumber,
    ).toBeNull();
  });

  test("an outage records WHY, because 'the register was down' is the evidence", () => {
    const a = toAttempt("DE345678906", {
      status: "unavailable",
      reason: "MS_UNAVAILABLE",
    });
    expect(a.detail).toBe("MS_UNAVAILABLE");
  });

  test("only an outage is retried; a settled answer is not asked again", () => {
    const outage = toAttempt("DE1", { status: "unavailable", reason: "MS_UNAVAILABLE" });
    const settled = toAttempt("DE1", {
      status: "invalid",
      countryCode: "DE",
      vatNumber: "1",
      checkedAt: "x",
    });
    expect(shouldRetry(outage)).toBe(true);
    expect(shouldRetry(settled)).toBe(false);
  });
});
