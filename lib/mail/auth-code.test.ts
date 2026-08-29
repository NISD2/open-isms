import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

/**
 * The installer, the README and three docs pages all tell a self-hoster to
 * find their first sign-in code with:
 *
 *   docker compose logs app | grep "sign-in code"
 *
 * That instruction is the only way into an instance with no mail provider, so
 * the log line it greps for is a contract rather than a debug aid.
 */

const sendMail = mock(async () => ({ success: true, id: "no-api-key" }) as const);

mock.module("./send", () => ({ sendMail }));

const { sendAuthCode } = await import("./auth-code");

let warnings: string[] = [];
const realWarn = console.warn;
const realKey = process.env.RESEND_API_KEY;

beforeEach(() => {
  warnings = [];
  console.warn = (...args: unknown[]) => {
    warnings.push(args.join(" "));
  };
});

afterEach(() => {
  console.warn = realWarn;
  if (realKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = realKey;
});

describe("sendAuthCode with no mail transport", () => {
  test("writes the sign-in code to the log, greppable as documented", async () => {
    delete process.env.RESEND_API_KEY;

    await sendAuthCode({ to: "operator@example.com", code: "481920", kind: "verification" });

    const line = warnings.find((w) => w.includes("sign-in code"));
    expect(line).toBeDefined();
    expect(line).toContain("481920");
    expect(line).toContain("operator@example.com");
  });

  test("names the password reset code separately", async () => {
    delete process.env.RESEND_API_KEY;

    await sendAuthCode({ to: "operator@example.com", code: "112233", kind: "password-reset" });

    expect(warnings.some((w) => w.includes("password reset code") && w.includes("112233"))).toBe(
      true,
    );
  });
});

describe("sendAuthCode with a mail transport", () => {
  test("logs no code", async () => {
    process.env.RESEND_API_KEY = "re_not_a_real_key";

    await sendAuthCode({ to: "operator@example.com", code: "999888", kind: "verification" });

    expect(warnings.join(" ")).not.toContain("999888");
  });
});
