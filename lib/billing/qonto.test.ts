import { afterEach, describe, expect, test } from "bun:test";
import { getOrganization, QONTO_PRODUCTION_BASE, qontoConfigFromEnv } from "./qonto";

const SANDBOX_BASE = "https://thirdparty-sandbox.staging.qonto.co/v2";

describe("qontoConfigFromEnv", () => {
  test("uses the production pair against the production host", () => {
    expect(qontoConfigFromEnv({ QONTO_LOGIN: "prod", QONTO_SECRET_KEY: "p" })).toEqual({
      baseUrl: QONTO_PRODUCTION_BASE,
      login: "prod",
      secretKey: "p",
    });
  });

  test("uses the sandbox pair against the sandbox host", () => {
    const c = qontoConfigFromEnv({
      QONTO_API_BASE: SANDBOX_BASE,
      QONTO_SANDBOX_LOGIN: "sand",
      QONTO_SANDBOX_SECRET_KEY: "s",
      QONTO_LOGIN: "prod",
      QONTO_SECRET_KEY: "p",
    });
    expect(c?.login).toBe("sand");
    expect(c?.secretKey).toBe("s");
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

  test("never uses a sandbox key against the production host", () => {
    expect(
      qontoConfigFromEnv({ QONTO_SANDBOX_LOGIN: "sand", QONTO_SANDBOX_SECRET_KEY: "s" }),
    ).toBeNull();
  });

  test("treats an empty base URL as unset", () => {
    expect(
      qontoConfigFromEnv({
        QONTO_API_BASE: "",
        QONTO_LOGIN: "prod",
        QONTO_SECRET_KEY: "p",
      })?.baseUrl,
    ).toBe(QONTO_PRODUCTION_BASE);
  });
});

describe("responses", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("a 200 that is not JSON comes back as a failure, not an exception", async () => {
    // What the sandbox does when the staging token is missing: an HTML login page with status 200.
    globalThis.fetch = Object.assign(
      async () =>
        new Response("<html>OneLogin</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      { preconnect: realFetch.preconnect },
    );
    const r = await getOrganization({
      baseUrl: SANDBOX_BASE,
      login: "x",
      secretKey: "y",
    });
    expect(r.ok).toBe(false);
  });
});
