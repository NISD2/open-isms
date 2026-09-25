import { describe, expect, test } from "bun:test";
import { mayOrderIn, orderingMode } from "./ordering";

const PROD = "https://thirdparty.qonto.com/v2";
const SANDBOX = "https://thirdparty-sandbox.staging.qonto.co/v2";
const prodKeys = { QONTO_LOGIN: "l", QONTO_SECRET_KEY: "s" };
const sandboxKeys = { QONTO_SANDBOX_LOGIN: "l", QONTO_SANDBOX_SECRET_KEY: "s" };

describe("orderingMode", () => {
  test("is off with no credentials, which is a fresh self-host and production before its keys", () => {
    expect(orderingMode({ QONTO_API_BASE: PROD, INVOICE_PREFIX: "RE" }).kind).toBe("off");
  });

  test("is off with an unusable invoice prefix", () => {
    expect(
      orderingMode({ QONTO_API_BASE: PROD, INVOICE_PREFIX: "re-", ...prodKeys }).kind,
    ).toBe("off");
  });

  test("is live against Qonto's production host", () => {
    expect(
      orderingMode({ QONTO_API_BASE: PROD, INVOICE_PREFIX: "RE", ...prodKeys }).kind,
    ).toBe("live");
  });

  test("is sandbox against the sandbox host, and never uses production keys there", () => {
    expect(
      orderingMode({ QONTO_API_BASE: SANDBOX, INVOICE_PREFIX: "RE", ...sandboxKeys })
        .kind,
    ).toBe("sandbox");
    expect(
      orderingMode({ QONTO_API_BASE: SANDBOX, INVOICE_PREFIX: "RE", ...prodKeys }).kind,
    ).toBe("off");
  });
});

describe("mayOrderIn", () => {
  const live = orderingMode({ QONTO_API_BASE: PROD, INVOICE_PREFIX: "RE", ...prodKeys });
  const sandbox = orderingMode({
    QONTO_API_BASE: SANDBOX,
    INVOICE_PREFIX: "RE",
    ...sandboxKeys,
  });
  const off = orderingMode({ QONTO_API_BASE: PROD, INVOICE_PREFIX: "RE" });

  test("lets anyone order live, only platform admins in the sandbox, and nobody when off", () => {
    expect(mayOrderIn(live, false)).toBe(true);
    expect(mayOrderIn(sandbox, false)).toBe(false);
    expect(mayOrderIn(sandbox, true)).toBe(true);
    expect(mayOrderIn(off, true)).toBe(false);
  });
});
