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

const sendMail = mock(async () => ({ success: true, id: "no-transport" }) as const);

// Full module shape: bun module mocks are process-global, so a partial mock
// here would strip exports (mailSuppressionReason, sendWelcomeEmail, ...)
// from send.ts for every test file that runs after this one.
mock.module("./send", () => ({
  sendMail,
  sendWelcomeEmail: async () => ({ success: true, id: "no-transport" }) as const,
  mailSuppressionReason: () => null,
  isSuppressedSendId: (id: string | undefined) =>
    id !== undefined && ["dev-blocked", "disabled", "no-transport", "dev-stub"].includes(id),
}));

/**
 * The transport is mocked rather than driven through process.env, because
 * configuredTransport() reads the validated `env` snapshot and a test mutating
 * process.env would not reach it. That gap is how an SMTP-configured instance
 * came to log every code: the only "has a transport" case here set
 * RESEND_API_KEY, so nothing covered the transport #154 added.
 */
let transport: "smtp" | "resend" | null = null;
mock.module("./transport", () => ({
  configuredTransport: () => transport,
  sendViaTransport: async () => ({ ok: true as const, id: "mock" }),
}));

const { sendAuthCode } = await import("./auth-code");

let warnings: string[] = [];
const realWarn = console.warn;

beforeEach(() => {
  warnings = [];
  transport = null;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.join(" "));
  };
});

afterEach(() => {
  console.warn = realWarn;
});

describe("sendAuthCode with no mail transport", () => {
  test("writes the sign-in code to the log, greppable as documented", async () => {
    await sendAuthCode({ to: "operator@example.com", code: "481920", kind: "verification" });

    const line = warnings.find((w) => w.includes("sign-in code"));
    expect(line).toBeDefined();
    expect(line).toContain("481920");
    expect(line).toContain("operator@example.com");
  });

  test("names the password reset code separately", async () => {
    await sendAuthCode({ to: "operator@example.com", code: "112233", kind: "password-reset" });

    expect(warnings.some((w) => w.includes("password reset code") && w.includes("112233"))).toBe(
      true,
    );
  });
});

describe("sendAuthCode with a mail transport", () => {
  test("logs no code when sending through Resend", async () => {
    transport = "resend";

    await sendAuthCode({ to: "operator@example.com", code: "999888", kind: "verification" });

    expect(warnings.join(" ")).not.toContain("999888");
  });

  // The regression. An instance with SMTP_HOST set delivered the mail *and*
  // wrote the code to the container log, because the check here read
  // RESEND_API_KEY directly instead of asking the transport layer. Caught by
  // running the self-host stack against Mailpit, not by any test.
  test("logs no code when sending through SMTP", async () => {
    transport = "smtp";

    await sendAuthCode({ to: "operator@example.com", code: "777666", kind: "verification" });

    expect(warnings.join(" ")).not.toContain("777666");
    expect(warnings.join(" ")).not.toContain("No mail transport is configured");
  });
});
