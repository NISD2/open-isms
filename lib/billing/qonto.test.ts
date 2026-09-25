import { afterEach, describe, expect, test } from "bun:test";
import {
  getOrganization,
  QONTO_PRODUCTION_BASE as PRODUCTION_BASE,
  qontoConfigFromEnv,
  sendInvoiceByEmail,
} from "./qonto";

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

  test("sending an invoice succeeds on 204 with no body", async () => {
    answer("", 204);
    const r = await sendInvoiceByEmail(config, "inv", {
      to: ["a@example.invalid"],
      subject: "s",
    });
    expect(r.ok).toBe(true);
  });
});
