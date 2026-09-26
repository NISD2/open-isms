import { afterEach, describe, expect, test } from "bun:test";
import { QONTO_PRODUCTION_BASE as PRODUCTION_BASE } from "./config-schema";
import { createCreditNote, getOrganization, qontoConfigFromEnv } from "./qonto";

const SANDBOX_BASE = "https://thirdparty-sandbox.staging.qonto.co/v2";

describe("qontoConfigFromEnv", () => {
  test("uses the production pair against the production host", () => {
    expect(
      qontoConfigFromEnv({
        QONTO_API_BASE: PRODUCTION_BASE,
        QONTO_LOGIN: "prod",
        QONTO_SECRET_KEY: "p",
      }),
    ).toEqual({ baseUrl: PRODUCTION_BASE, login: "prod", secretKey: "p" });
  });

  test("uses the sandbox pair and the staging token against the sandbox host", () => {
    expect(
      qontoConfigFromEnv({
        QONTO_API_BASE: SANDBOX_BASE,
        QONTO_SANDBOX_LOGIN: "sand",
        QONTO_SANDBOX_SECRET_KEY: "s",
        QONTO_STAGING_TOKEN: "t",
        QONTO_LOGIN: "prod",
        QONTO_SECRET_KEY: "p",
      }),
    ).toEqual({
      baseUrl: SANDBOX_BASE,
      login: "sand",
      secretKey: "s",
      stagingToken: "t",
    });
  });

  test("never sends the production secret to the sandbox host", () => {
    expect(
      qontoConfigFromEnv({
        QONTO_API_BASE: SANDBOX_BASE,
        QONTO_LOGIN: "prod",
        QONTO_SECRET_KEY: "p",
      }),
    ).toBeNull();
  });

  test("never uses a sandbox credential against the production host", () => {
    expect(
      qontoConfigFromEnv({
        QONTO_API_BASE: PRODUCTION_BASE,
        QONTO_SANDBOX_LOGIN: "sand",
        QONTO_SANDBOX_SECRET_KEY: "s",
      }),
    ).toBeNull();
  });

  test("sends credentials to no host except Qonto's two, and never over plain http", () => {
    const all = {
      QONTO_LOGIN: "prod",
      QONTO_SECRET_KEY: "p",
      QONTO_SANDBOX_LOGIN: "sand",
      QONTO_SANDBOX_SECRET_KEY: "s",
    };
    for (const base of [
      "http://thirdparty-sandbox.staging.qonto.co/v2",
      "http://thirdparty.qonto.com/v2",
      "https://thirdparty.qonto.co/v2",
      "https://example.com/v2",
      "not a url",
    ]) {
      expect(qontoConfigFromEnv({ QONTO_API_BASE: base, ...all })).toBeNull();
    }
  });

  test("never attaches the staging token for the production host", () => {
    expect(
      qontoConfigFromEnv({
        QONTO_API_BASE: PRODUCTION_BASE,
        QONTO_LOGIN: "prod",
        QONTO_SECRET_KEY: "p",
        QONTO_STAGING_TOKEN: "t",
      }),
    ).not.toHaveProperty("stagingToken");
  });
});

describe("responses", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const answer = (body: string, status: number) => {
    globalThis.fetch = Object.assign(async () => new Response(body || null, { status }), {
      preconnect: realFetch.preconnect,
    });
  };

  const config = { baseUrl: SANDBOX_BASE, login: "x", secretKey: "y" };

  test("a 200 that is not JSON comes back as a failure, not an exception", async () => {
    // What the sandbox does when the staging token is missing: an HTML login page with status 200.
    answer("<html>OneLogin</html>", 200);
    expect((await getOrganization(config)).ok).toBe(false);
  });

  test("an empty 200 on a call that promises a body is a failure, not null data", async () => {
    answer("", 200);
    expect((await getOrganization(config)).ok).toBe(false);
  });

  test("a credit note is posted with the fields Qonto requires and our own number", async () => {
    const seen: { url: string; body: unknown }[] = [];
    globalThis.fetch = Object.assign(
      async (url: string | URL | Request, init?: RequestInit) => {
        seen.push({ url: String(url), body: JSON.parse(String(init?.body)) });
        return new Response(JSON.stringify({ credit_note: { id: "cn-1" } }), {
          status: 201,
        });
      },
      { preconnect: realFetch.preconnect },
    );
    const res = await createCreditNote(config, {
      invoiceId: "inv-1",
      number: "GS-2026-0001",
      issueDate: "2026-09-26",
      reason: "Kündigung",
      items: [
        {
          title: "NIS 2 Durchgang, Jahreslizenz",
          quantity: "1",
          unit: "unit",
          unitPrice: { value: "4800.00", currency: "EUR" },
          vatRate: "0.19",
        },
      ],
    });
    expect(res.ok && res.data.credit_note?.id).toBe("cn-1");
    expect(seen[0]?.url).toBe(`${SANDBOX_BASE}/credit_notes`);
    expect(seen[0]?.body).toEqual({
      invoice_id: "inv-1",
      issue_date: "2026-09-26",
      currency: "EUR",
      reason: "Kündigung",
      number: "GS-2026-0001",
      items: [
        {
          title: "NIS 2 Durchgang, Jahreslizenz",
          quantity: "1",
          unit: "unit",
          unit_price: { value: "4800.00", currency: "EUR" },
          vat_rate: "0.19",
        },
      ],
    });
  });
});
