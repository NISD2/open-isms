/**
 * A password sign-in with a second factor, as `authorize` runs it. There is no half signed-in
 * state: a person whose app is on gets no session for the password alone, so no page or API can
 * ever see them before the code. A code counts once, a recovery code once, too many tries are
 * refused before any is checked, and someone who must have it sets it up inside the sign-in.
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const state = {
  audits: [] as Array<{ action: string; newValue?: unknown; entityId: string | null }>,
  blocked: new Set<string>(),
  platformAdmins: new Set<string>(),
};

// Other suites mock this module for the whole run, so this one says who the admins are itself.
mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [...state.platformAdmins],
  isPlatformAdmin: (email: string | null | undefined) =>
    !!email && state.platformAdmins.has(email.toLowerCase()),
  requirePlatformAdmin: async () => {},
}));

// lib/db and lib/audit validate the environment at load, and CI runs this suite without one.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
mock.module("@/lib/audit", () => ({
  logAudit: async (entry: (typeof state.audits)[number]) => {
    state.audits.push(entry);
  },
}));
const rateLimitModule = await import("@/lib/rate-limit");
mock.module("@/lib/rate-limit", () => ({
  ...rateLimitModule,
  rateLimit: async (key: string) => !state.blocked.has(key),
}));

const { passwordSignIn } = await import("./sign-in");
const { currentCode } = await import("./codes");
const { decryptSecret } = await import("./crypto");
const { startSetup } = await import("./store");
const { fakeTwoFactorDb } = await import("./testing");
const { failureNotice } = await import("./notice");

const KEY = randomBytes(32);
const PASSWORD = "correct horse battery staple";
const PERSON = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "it@customer.example",
  name: "IT",
  companyId: "22222222-2222-4222-8222-222222222222",
  passwordHash: bcrypt.hashSync(PASSWORD, 4),
  emailVerifiedAt: new Date("2026-09-01T08:00:00Z"),
};
const REQUEST = { ip: "203.0.113.9", userAgent: "test" };
const T0 = new Date(Date.UTC(2026, 9, 30, 12, 0, 10));
const later = (steps: number) => new Date(T0.getTime() + steps * 30_000);

let fake = fakeTwoFactorDb([PERSON]);
const signIn = (totpCode: string | undefined, now = T0, password = PASSWORD) =>
  passwordSignIn(fake.db, KEY, { email: PERSON.email, password, totpCode }, REQUEST, now);

/** Sets the app up for PERSON as Settings would, and returns its secret and recovery codes. */
async function turnOn() {
  const material = await startSetup(
    fake.db,
    KEY,
    { userId: PERSON.id, email: PERSON.email },
    T0,
  );
  const { confirmSetup } = await import("./store");
  const ok = await confirmSetup(
    fake.db,
    KEY,
    PERSON.id,
    currentCode(material.secret, T0.getTime()),
    T0,
  );
  expect(ok).toBe(true);
  return material;
}

beforeEach(() => {
  fake = fakeTwoFactorDb([PERSON]);
  state.audits = [];
  state.blocked = new Set();
  state.platformAdmins = new Set();
});

describe("without a second factor", () => {
  test("the password alone signs in", async () => {
    expect(await signIn(undefined)).toMatchObject({ ok: true });
  });

  test("a wrong password says nothing about a second factor", async () => {
    await turnOn();
    expect(await signIn(undefined, T0, "wrong")).toEqual({ ok: false, code: null });
  });
});

describe("with the app on", () => {
  test("the password alone gets no session, only the request for a code", async () => {
    await turnOn();
    expect(await signIn(undefined, later(1))).toEqual({
      ok: false,
      code: "TWO_FACTOR_REQUIRED",
    });
  });

  test("a current code signs in, and the same code a second time does not", async () => {
    const { secret } = await turnOn();
    const code = currentCode(secret, later(2).getTime());
    expect(await signIn(code, later(2))).toMatchObject({ ok: true });
    expect(await signIn(code, later(2))).toEqual({
      ok: false,
      code: "TWO_FACTOR_INVALID",
    });
  });

  test("the code used to set it up cannot sign in", async () => {
    const { secret } = await turnOn();
    const setupCode = currentCode(secret, T0.getTime());
    expect(await signIn(setupCode, T0)).toEqual({
      ok: false,
      code: "TWO_FACTOR_INVALID",
    });
  });

  test("a wrong code is refused", async () => {
    const { secret } = await turnOn();
    const right = currentCode(secret, later(3).getTime());
    const wrong = right === "000000" ? "111111" : "000000";
    expect(await signIn(wrong, later(3))).toEqual({
      ok: false,
      code: "TWO_FACTOR_INVALID",
    });
  });

  test("a recovery code signs in once, and the use is recorded without the code", async () => {
    const { recoveryCodes } = await turnOn();
    const [first] = recoveryCodes;
    expect(await signIn(first, later(1))).toMatchObject({ ok: true });
    expect(await signIn(first, later(2))).toEqual({
      ok: false,
      code: "TWO_FACTOR_INVALID",
    });
    const used = state.audits.find(
      (a) => a.action === "user.two_factor_recovery_code_used",
    );
    expect(used?.newValue).toEqual({ at: "sign_in", recoveryCodesLeft: 9 });
    expect(JSON.stringify(state.audits)).not.toContain(first);
  });

  test("past the attempt limit nothing is checked, even the right code", async () => {
    const { secret } = await turnOn();
    state.blocked.add(`two-factor:${PERSON.id}`);
    const code = currentCode(secret, later(4).getTime());
    expect(await signIn(code, later(4))).toEqual({ ok: false, code: "RATE_LIMITED" });
    state.blocked.clear();
    expect(await signIn(code, later(4))).toMatchObject({ ok: true });
  });

  test("after AUTH_SECRET changed: a clear refusal, not counted, and a recovery code still works", async () => {
    const { secret, recoveryCodes } = await turnOn();
    const rotated = randomBytes(32);
    const withRotatedKey = (totpCode: string) =>
      passwordSignIn(
        fake.db,
        rotated,
        { email: PERSON.email, password: PASSWORD, totpCode },
        REQUEST,
        later(1),
      );
    expect(await withRotatedKey(currentCode(secret, later(1).getTime()))).toEqual({
      ok: false,
      code: "TWO_FACTOR_UNREADABLE",
    });
    expect(fake.state.rows.get(PERSON.id)?.failedAttempts).toBe(0);
    expect(await withRotatedKey(recoveryCodes[0])).toMatchObject({ ok: true });
  });

  test("the secret is stored encrypted, never as the app shows it", async () => {
    const { secret } = await turnOn();
    const row = fake.state.rows.get(PERSON.id);
    expect(row?.secretEncrypted).not.toContain(secret);
    expect(
      row?.secretEncrypted && decryptSecret(row.secretEncrypted, KEY, PERSON.id),
    ).toBe(secret);
  });
});

describe("a run of wrong codes", () => {
  const wrongAt = (secret: string, at: Date) =>
    currentCode(secret, at.getTime()) === "000000" ? "111111" : "000000";
  const failures = () => fake.state.rows.get(PERSON.id)?.failedAttempts;

  test("is counted, earns a notice at ten and at a hundred, and a right code ends it", async () => {
    const { secret } = await turnOn();
    for (let i = 0; i < 9; i++) await signIn(wrongAt(secret, later(1)), later(1));
    expect(failures()).toBe(9);
    expect(failureNotice(9)).toBeNull();
    expect(failureNotice(10)).toBe("failures");
    expect(failureNotice(11)).toBeNull();
    expect(failureNotice(100)).toBe("locked");
    expect(await signIn(currentCode(secret, later(2).getTime()), later(2))).toMatchObject(
      {
        ok: true,
      },
    );
    expect(failures()).toBe(0);
  });

  test("past a hundred refuses even the right app code; a recovery code still works and ends it", async () => {
    const { secret, recoveryCodes } = await turnOn();
    const row = fake.state.rows.get(PERSON.id);
    if (!row) throw new Error("no row");
    fake.state.rows.set(PERSON.id, { ...row, failedAttempts: 99 });
    expect(await signIn(wrongAt(secret, later(1)), later(1))).toEqual({
      ok: false,
      code: "TWO_FACTOR_LOCKED",
    });
    expect(failures()).toBe(100);
    const right = currentCode(secret, later(2).getTime());
    expect(await signIn(right, later(2))).toEqual({
      ok: false,
      code: "TWO_FACTOR_LOCKED",
    });
    expect(await signIn(recoveryCodes[0], later(2))).toMatchObject({ ok: true });
    expect(failures()).toBe(0);
    expect(await signIn(right, later(2))).toMatchObject({ ok: true });
  });
});

describe("when it is required and not set up", () => {
  test("a company that requires it sends the person to set it up", async () => {
    fake.state.companyRequires = true;
    expect(await signIn(undefined)).toEqual({
      ok: false,
      code: "TWO_FACTOR_SETUP_REQUIRED",
    });
  });

  test("a platform admin is always sent to set it up", async () => {
    state.platformAdmins.add(PERSON.email);
    expect(await signIn(undefined)).toEqual({
      ok: false,
      code: "TWO_FACTOR_SETUP_REQUIRED",
    });
  });

  test("the first code after the setup turns it on and signs in", async () => {
    fake.state.companyRequires = true;
    const material = await startSetup(
      fake.db,
      KEY,
      { userId: PERSON.id, email: PERSON.email },
      T0,
    );
    const code = currentCode(material.secret, later(1).getTime());
    expect(await signIn(code, later(1))).toMatchObject({ ok: true });
    expect(fake.state.rows.get(PERSON.id)?.enabledAt).toEqual(later(1));
    const enabled = state.audits.find((a) => a.action === "user.two_factor_enabled");
    expect(enabled?.newValue).toEqual({ how: "sign_in", requiredBy: "company" });
    // Sessions opened on the password alone end; this sign-in is issued after and carries the
    // new version.
    expect(fake.state.sessionsEnded).toEqual([PERSON.id]);
  });

  test("a setup left for more than fifteen minutes has to be started again", async () => {
    fake.state.companyRequires = true;
    const material = await startSetup(
      fake.db,
      KEY,
      { userId: PERSON.id, email: PERSON.email },
      T0,
    );
    const late = later(31);
    const code = currentCode(material.secret, late.getTime());
    expect(await signIn(code, late)).toEqual({ ok: false, code: "TWO_FACTOR_INVALID" });
  });
});
