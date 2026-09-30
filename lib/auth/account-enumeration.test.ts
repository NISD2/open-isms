import { beforeEach, describe, expect, mock, test } from "bun:test";

/**
 * /api/auth/register and /api/auth/forgot-password must not tell an address
 * that has an account from one that does not: not by the body, not by the
 * status, and not by how long the answer takes. The routes answer before they
 * look the address up and do the rest in `after()`, so these tests pin both
 * halves: the response is identical for every kind of address and is made with
 * no lookup at all, and the work queued behind it does the right thing for each.
 *
 * /api/auth/resend-verification follows the same rule. /api/auth/reset-password
 * is here too because it shares these fixtures: it is the recovery path the
 * Google linking rule relies on.
 *
 * The routes live under app/, which `test:unit` does not scan, so the suite
 * sits here beside the auth code it exercises.
 */

type Account = {
  id: string;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  locale: string | null;
};

const VERIFIED = new Date("2026-09-01T08:00:00Z");
const ACCOUNTS = {
  none: undefined,
  pendingVerify: { id: "u1", passwordHash: "hash", emailVerifiedAt: null, locale: null },
  verifiedPassword: {
    id: "u2",
    passwordHash: "hash",
    emailVerifiedAt: VERIFIED,
    locale: "en",
  },
  googleOnly: { id: "u3", passwordHash: null, emailVerifiedAt: VERIFIED, locale: null },
  unverifiedNoPassword: {
    id: "u4",
    passwordHash: null,
    emailVerifiedAt: null,
    locale: null,
  },
} as const satisfies Record<string, Account | undefined>;

const state: {
  account: Account | undefined;
  lookups: number;
  otpLimited: boolean;
  otpValid: boolean;
  deferred: Array<() => unknown>;
  sent: Array<{ emailType: string; to: string | string[] }>;
  updates: Array<Record<string, unknown>>;
} = {
  account: undefined,
  lookups: 0,
  otpLimited: false,
  otpValid: true,
  deferred: [],
  sent: [],
  updates: [],
};

// lib/mail and lib/db validate the environment at load, and CI runs this suite
// without one. Same shape as lib/mail/footer.test.ts.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));

mock.module("@/lib/db", () => ({
  db: {
    query: {
      user: {
        findFirst: async () => {
          state.lookups += 1;
          return state.account;
        },
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        state.updates.push(values);
        return { where: async () => undefined };
      },
    }),
    insert: () => ({ values: () => ({ onConflictDoNothing: async () => undefined }) }),
  },
}));

// `after()` only exists inside a Next.js request. Captured here and run by hand,
// which is also what lets a test look at the response before the work behind it.
const nextServer = await import("next/server");
mock.module("next/server", () => ({
  ...nextServer,
  after: (task: () => unknown) => {
    state.deferred.push(task);
  },
}));

const rateLimitModule = await import("@/lib/rate-limit");
mock.module("@/lib/rate-limit", () => ({
  ...rateLimitModule,
  rateLimit: async () => true,
}));

// The real check does an MX lookup and an rdap fetch.
mock.module("@/lib/auth/email-quality", () => ({
  checkEmailQuality: async () => ({ block: false }),
}));

const otp = await import("@/lib/auth/otp");
mock.module("@/lib/auth/otp", () => ({
  ...otp,
  requestOtp: async () => {
    if (state.otpLimited) throw new otp.OtpRateLimitedError();
    return { code: "123456" };
  },
  verifyOtp: async () => state.otpValid,
}));

// Full module shape: bun module mocks are process-global (see lib/mail/auth-code.test.ts).
mock.module("@/lib/mail/send", () => ({
  sendMail: async (opts: { emailType: string; to: string | string[] }) => {
    state.sent.push({ emailType: opts.emailType, to: opts.to });
    return { success: true, id: "sent" } as const;
  },
  sendWelcomeEmail: async () => ({ success: true, id: "unused" }) as const,
  mailSuppressionReason: () => null,
}));

const register = await import("@/app/api/auth/register/route");
const forgotPassword = await import("@/app/api/auth/forgot-password/route");
const resendVerification = await import("@/app/api/auth/resend-verification/route");
const resetPassword = await import("@/app/api/auth/reset-password/route");

const EMAIL = "it@customer.example";

function post(path: string, body: Record<string, unknown>): Request {
  return new Request(`https://example.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "203.0.113.7" },
    body: JSON.stringify(body),
  });
}

/** The response as a client sees it, plus how many lookups it waited on. */
async function answer(response: Response) {
  return { status: response.status, body: await response.text(), lookups: state.lookups };
}

async function runDeferred(): Promise<void> {
  for (const task of state.deferred.splice(0)) await task();
}

beforeEach(() => {
  state.account = undefined;
  state.lookups = 0;
  state.otpLimited = false;
  state.otpValid = true;
  state.deferred.splice(0);
  state.sent.splice(0);
  state.updates.splice(0);
});

describe("POST /api/auth/register", () => {
  const request = () =>
    post("/api/auth/register", { email: EMAIL, password: "correct horse", locale: "de" });

  async function registerAs(account: Account | undefined) {
    state.account = account;
    return answer(await register.POST(request()));
  }

  test("answers a new, a pending and a verified address identically, before any lookup", async () => {
    const answers = [
      await registerAs(ACCOUNTS.none),
      await registerAs(ACCOUNTS.pendingVerify),
      await registerAs(ACCOUNTS.verifiedPassword),
    ];
    for (const a of answers) {
      expect(a).toEqual({
        status: 200,
        body: JSON.stringify({ success: true, verificationRequired: true }),
        lookups: 0,
      });
    }
  });

  test("a new address gets a verification code after the response", async () => {
    await registerAs(ACCOUNTS.none);
    await runDeferred();
    expect(state.sent).toEqual([{ emailType: "auth.verification_code", to: EMAIL }]);
  });

  test("a verified address gets the owner notice, never a code", async () => {
    await registerAs(ACCOUNTS.verifiedPassword);
    await runDeferred();
    expect(state.sent).toEqual([{ emailType: "auth.registration_attempt", to: EMAIL }]);
  });

  test("past the per-email code limit the answer is the same 200 and no mail goes out", async () => {
    const fresh = await registerAs(ACCOUNTS.pendingVerify);
    state.deferred.splice(0);
    state.otpLimited = true;
    const limited = await registerAs(ACCOUNTS.pendingVerify);
    expect(limited).toEqual(fresh);

    await runDeferred();
    expect(state.sent).toEqual([]);
  });
});

describe("POST /api/auth/forgot-password", () => {
  const request = () => post("/api/auth/forgot-password", { email: EMAIL, locale: "de" });

  async function forgotAs(account: Account | undefined) {
    state.account = account;
    return answer(await forgotPassword.POST(request()));
  }

  test("answers every kind of address identically, before any lookup", async () => {
    const answers = [
      await forgotAs(ACCOUNTS.none),
      await forgotAs(ACCOUNTS.verifiedPassword),
      await forgotAs(ACCOUNTS.googleOnly),
      await forgotAs(ACCOUNTS.unverifiedNoPassword),
    ];
    for (const a of answers) {
      expect(a).toEqual({
        status: 200,
        body: JSON.stringify({ success: true }),
        lookups: 0,
      });
    }
  });

  test("a malformed address gets the same answer", async () => {
    const response = await forgotPassword.POST(
      post("/api/auth/forgot-password", { email: "not-an-address" }),
    );
    expect(await answer(response)).toEqual({
      status: 200,
      body: JSON.stringify({ success: true }),
      lookups: 0,
    });
    expect(state.deferred).toEqual([]);
  });

  const cases = [
    ["a password account", ACCOUNTS.verifiedPassword, 1],
    ["a pending password account", ACCOUNTS.pendingVerify, 1],
    // The recovery path: a Google-only owner can still prove the mailbox.
    ["a verified account with no password", ACCOUNTS.googleOnly, 1],
    ["an unverified account with no password", ACCOUNTS.unverifiedNoPassword, 0],
    ["no account", ACCOUNTS.none, 0],
  ] as const;
  for (const [name, account, codes] of cases) {
    test(`${name} is sent ${codes} reset code(s) after the response`, async () => {
      await forgotAs(account);
      await runDeferred();
      expect(
        state.sent.filter((m) => m.emailType === "auth.password_reset_code"),
      ).toHaveLength(codes);
    });
  }

  test("past the per-email code limit nothing is sent and nothing throws", async () => {
    state.otpLimited = true;
    await forgotAs(ACCOUNTS.verifiedPassword);
    await runDeferred();
    expect(state.sent).toEqual([]);
  });
});

describe("POST /api/auth/resend-verification", () => {
  const request = () =>
    post("/api/auth/resend-verification", { email: EMAIL, locale: "de" });

  // The route asks only for a PENDING row, so an unknown address and a verified
  // one look the same to it: no row.
  async function resendAs(pendingRow: Account | undefined) {
    state.account = pendingRow;
    return answer(await resendVerification.POST(request()));
  }

  test("answers a pending and an unknown or verified address identically, before any lookup", async () => {
    const answers = [
      await resendAs(ACCOUNTS.pendingVerify),
      await resendAs(ACCOUNTS.none),
    ];
    for (const a of answers) {
      expect(a).toEqual({
        status: 200,
        body: JSON.stringify({ success: true }),
        lookups: 0,
      });
    }
  });

  test("only a pending address is sent a code, after the response", async () => {
    await resendAs(ACCOUNTS.none);
    await runDeferred();
    expect(state.sent).toEqual([]);

    await resendAs(ACCOUNTS.pendingVerify);
    await runDeferred();
    expect(state.sent).toEqual([{ emailType: "auth.verification_code", to: EMAIL }]);
  });

  test("past the per-email code limit the answer is the same 200 and no mail goes out", async () => {
    state.otpLimited = true;
    const limited = await resendAs(ACCOUNTS.pendingVerify);
    expect(limited).toEqual({
      status: 200,
      body: JSON.stringify({ success: true }),
      lookups: 0,
    });
    await runDeferred();
    expect(state.sent).toEqual([]);
  });
});

describe("POST /api/auth/reset-password", () => {
  const request = () =>
    post("/api/auth/reset-password", {
      email: EMAIL,
      code: "123456",
      newPassword: "a new password",
    });

  // A stale Google account linked first and the owner recovers by mail: the
  // reset has to take that Google account's access away, not only set a password.
  test("a reset unlinks the Google account along with setting the password", async () => {
    state.account = ACCOUNTS.googleOnly;
    const response = await resetPassword.POST(request());
    expect(response.status).toBe(200);
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0]).toMatchObject({
      googleSubject: null,
      emailVerifiedAt: VERIFIED,
    });
    expect(typeof state.updates[0].passwordHash).toBe("string");
  });

  test("a wrong code changes nothing", async () => {
    state.account = ACCOUNTS.googleOnly;
    state.otpValid = false;
    const response = await resetPassword.POST(request());
    expect(response.status).toBe(400);
    expect(state.updates).toEqual([]);
  });
});
