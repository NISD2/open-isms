/**
 * Two-factor sign-in in Settings and for the platform admin: a person sets it up with their
 * password (or, signing in with Google only, a recent sign-in) and turns it off with a code, cannot
 * turn it off while it is required, a company admin requires it only for their own company, which
 * ends the sessions of that company's members still signing in with a password alone, and only a
 * platform admin resets someone else's, never their own. No assistant's key reaches any of it.
 *
 * There is no database here: lib/auth/two-factor/testing.ts stands in for it.
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";

const audits: Array<{
  action: string;
  userId: string | null;
  companyId: string | null;
  entityId: string | null;
  newValue?: unknown;
}> = [];

// The router reaches lib/db and lib/auth, which read a validated env as they load; CI has none.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
mock.module("@/lib/audit", () => ({
  logAudit: async (entry: (typeof audits)[number]) => {
    audits.push(entry);
  },
}));
// Other suites mock this module for the whole run, so this one says who the admins are itself.
const platformAdmins = new Set<string>();
mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [...platformAdmins],
  isPlatformAdmin: (email: string | null | undefined) =>
    !!email && platformAdmins.has(email.toLowerCase()),
  requirePlatformAdmin: async () => {},
}));
const rateLimitModule = await import("@/lib/rate-limit");
/** Keys a test has used up: the sign-in budget the password check counts against. */
const spent = new Set<string>();
mock.module("@/lib/rate-limit", () => ({
  ...rateLimitModule,
  rateLimit: async (key: string) => ![...spent].some((prefix) => key.startsWith(prefix)),
}));
const bcrypt = (await import("bcryptjs")).default;

const { createCallerFactory } = await import("../init");
const { appRouter } = await import("../router");
const { currentCode } = await import("@/lib/auth/two-factor/codes");
const { fakeTwoFactorDb } = await import("@/lib/auth/two-factor/testing");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "33333333-3333-4333-8333-333333333333";
const ME = {
  id: "44444444-4444-4444-8444-444444444444",
  email: "admin@customer.example",
  name: "Admin",
  companyId: COMPANY,
  passwordHash: null,
  emailVerifiedAt: new Date(),
};
const OTHER = {
  id: "55555555-5555-4555-8555-555555555555",
  email: "lost-phone@other.example",
  name: "Lost",
  companyId: "66666666-6666-4666-8666-666666666666",
  passwordHash: null,
  emailVerifiedAt: new Date(),
};

const PASSWORD = "correct horse battery staple";
/** Signs in with a password, so setting the app up takes it. ME signs in with Google only. */
const WITH_PASSWORD = {
  id: "77777777-7777-4777-8777-777777777777",
  email: "password@customer.example",
  name: "Password",
  companyId: COMPANY,
  passwordHash: bcrypt.hashSync(PASSWORD, 4),
  emailVerifiedAt: new Date(),
};
/** Signs in with a password and has the app set up already. */
const WITH_APP = {
  ...WITH_PASSWORD,
  id: "88888888-8888-4888-8888-888888888888",
  email: "has-app@customer.example",
};
const PEOPLE = [ME, OTHER, WITH_PASSWORD, WITH_APP];

let fake = fakeTwoFactorDb(PEOPLE);

const nowS = () => Math.floor(Date.now() / 1000);

function callerFor({
  as = ME,
  role = "admin",
  viaKey = false,
  authTime = nowS(),
}: {
  as?: typeof ME | typeof WITH_PASSWORD;
  role?: string;
  viaKey?: boolean;
  /** When the session signed in; a minute ago unless a test says otherwise. */
  authTime?: number;
} = {}) {
  return createCallerFactory(appRouter)({
    db: fake.db as TRPCContext["db"],
    session: {
      user: { id: as.id, email: as.email },
      role,
      jobTitle: null,
      companyId: COMPANY,
      accessLevel: "full",
      authTime,
    } as TRPCContext["session"],
    userId: as.id,
    companyId: COMPANY,
    ip: "203.0.113.9",
    userAgent: viaKey ? "mcp: Claude" : "Mozilla/5.0",
    viaKey,
  }).twoFactor;
}

const codeOf = async (call: Promise<unknown>) =>
  call.then(
    () => null,
    (e: unknown) => (e instanceof TRPCError ? e.code : "not a TRPCError"),
  );

/** Sets the app up for ME through Settings and returns its secret and recovery codes. */
async function turnOn() {
  const material = await callerFor().startSetup({});
  await callerFor().confirmSetup({ totpCode: currentCode(material.secret, Date.now()) });
  return material;
}

/** A turned-on app for someone, as the store leaves it. */
const appOn = (userId: string) =>
  fake.state.rows.set(userId, {
    userId,
    secretEncrypted: "v1:a:b:c",
    enabledAt: new Date(),
    recoveryCodeHashes: ["h"],
    lastUsedStep: 1,
    failedAttempts: 0,
    pendingSecretEncrypted: null,
    pendingRecoveryCodeHashes: null,
    pendingStartedAt: null,
    updatedAt: new Date(),
  });

beforeEach(() => {
  fake = fakeTwoFactorDb(PEOPLE);
  audits.length = 0;
  platformAdmins.clear();
  spent.clear();
});

describe("in Settings", () => {
  test("setting up shows a QR code and ten recovery codes, and the first code turns it on", async () => {
    const material = await callerFor().startSetup({});
    expect(material.qrDataUrl.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(material.uri.startsWith("otpauth://totp/")).toBe(true);
    expect(material.recoveryCodes).toHaveLength(10);
    expect((await callerFor().status()).enabledAt).toBeNull();

    await callerFor().confirmSetup({
      totpCode: currentCode(material.secret, Date.now()),
    });
    const status = await callerFor().status();
    expect(status.enabledAt).not.toBeNull();
    expect(status.recoveryCodesLeft).toBe(10);
    expect(audits.map((a) => a.action)).toContain("user.two_factor_enabled");
  });

  test("turning it on and off each end every session of the person", async () => {
    const { recoveryCodes } = await turnOn();
    expect(fake.state.sessionsEnded).toEqual([ME.id]);
    const { recoveryCodes: fresh } = await callerFor().replaceRecoveryCodes({
      totpCode: recoveryCodes[0],
    });
    expect(fake.state.sessionsEnded).toEqual([ME.id]);
    await callerFor().disable({ totpCode: fresh[0] });
    expect(fake.state.sessionsEnded).toEqual([ME.id, ME.id]);
  });

  test("past a hundred wrong codes, Settings refuses app codes and says so", async () => {
    const { secret, recoveryCodes } = await turnOn();
    const row = fake.state.rows.get(ME.id);
    if (!row) throw new Error("no row");
    fake.state.rows.set(ME.id, { ...row, failedAttempts: 100 });
    const code = currentCode(secret, Date.now() + 60_000);
    expect(await codeOf(callerFor().replaceRecoveryCodes({ totpCode: code }))).toBe(
      "PRECONDITION_FAILED",
    );
    await callerFor().replaceRecoveryCodes({ totpCode: recoveryCodes[0] });
    expect(fake.state.rows.get(ME.id)?.failedAttempts).toBe(0);
  });

  test("a wrong first code leaves it off", async () => {
    await callerFor().startSetup({});
    expect(await codeOf(callerFor().confirmSetup({ totpCode: "000000" }))).toBe(
      "BAD_REQUEST",
    );
    expect((await callerFor().status()).enabledAt).toBeNull();
  });

  test("it cannot be set up a second time over the one that is on", async () => {
    await turnOn();
    expect(await codeOf(callerFor().startSetup({}))).toBe("CONFLICT");
  });

  test("turning it off takes a recovery code or a fresh code", async () => {
    const { recoveryCodes } = await turnOn();
    expect(await codeOf(callerFor().disable({ totpCode: "000000" }))).toBe("BAD_REQUEST");
    await callerFor().disable({ totpCode: recoveryCodes[3] });
    expect((await callerFor().status()).enabledAt).toBeNull();
    const off = audits.find((a) => a.action === "user.two_factor_disabled");
    expect(off?.newValue).toEqual({ confirmedWith: "recovery" });
  });

  test("it cannot be turned off while the company requires it", async () => {
    const { recoveryCodes } = await turnOn();
    fake.state.companyRequires = true;
    expect(await codeOf(callerFor().disable({ totpCode: recoveryCodes[0] }))).toBe(
      "PRECONDITION_FAILED",
    );
  });

  test("new recovery codes replace the old ones", async () => {
    const { recoveryCodes } = await turnOn();
    const { recoveryCodes: fresh } = await callerFor().replaceRecoveryCodes({
      totpCode: recoveryCodes[0],
    });
    expect(fresh).toHaveLength(10);
    expect(await codeOf(callerFor().disable({ totpCode: recoveryCodes[1] }))).toBe(
      "BAD_REQUEST",
    );
    await callerFor().disable({ totpCode: fresh[0] });
  });

  test("no code a person types reaches the audit log", async () => {
    const { recoveryCodes } = await turnOn();
    await callerFor().disable({ totpCode: recoveryCodes[0] });
    expect(JSON.stringify(audits)).not.toContain(recoveryCodes[0]);
  });
});

describe("setting it up takes the person, not only the session", () => {
  const asPassword = () => callerFor({ as: WITH_PASSWORD });

  test("an account with a password starts and confirms the setup only with that password", async () => {
    expect(await codeOf(asPassword().startSetup({}))).toBe("UNAUTHORIZED");
    expect(await codeOf(asPassword().startSetup({ password: "guessed" }))).toBe(
      "UNAUTHORIZED",
    );
    expect(fake.state.rows.has(WITH_PASSWORD.id)).toBe(false);

    const material = await asPassword().startSetup({ password: PASSWORD });
    const totpCode = currentCode(material.secret, Date.now());
    expect(await codeOf(asPassword().confirmSetup({ totpCode }))).toBe("UNAUTHORIZED");
    expect(fake.state.rows.get(WITH_PASSWORD.id)?.enabledAt).toBeNull();

    await asPassword().confirmSetup({ totpCode, password: PASSWORD });
    expect(fake.state.rows.get(WITH_PASSWORD.id)?.enabledAt).not.toBeNull();
  });

  test("the password check counts against the sign-in budget", async () => {
    spent.add(`login:email:${WITH_PASSWORD.email}`);
    expect(await codeOf(asPassword().startSetup({ password: PASSWORD }))).toBe(
      "TOO_MANY_REQUESTS",
    );
  });

  test("no password typed reaches the audit log", async () => {
    const material = await asPassword().startSetup({ password: PASSWORD });
    await asPassword().confirmSetup({
      totpCode: currentCode(material.secret, Date.now()),
      password: PASSWORD,
    });
    expect(JSON.stringify(audits)).not.toContain(PASSWORD);
  });

  test("a Google-only account needs a sign-in from the last few minutes instead", async () => {
    const twentyMinutesAgo = nowS() - 20 * 60;
    const stale = callerFor({ authTime: twentyMinutesAgo });
    await expect(stale.startSetup({})).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "reauth",
    });
    expect(fake.state.rows.has(ME.id)).toBe(false);
    const material = await callerFor().startSetup({});
    expect(
      await codeOf(
        stale.confirmSetup({ totpCode: currentCode(material.secret, Date.now()) }),
      ),
    ).toBe("FORBIDDEN");
  });

  test("status tells Settings which of the two it asks for", async () => {
    expect((await callerFor().status()).hasPassword).toBe(false);
    expect((await asPassword().status()).hasPassword).toBe(true);
  });
});

describe("the company's requirement", () => {
  test("an admin sets it for their own open company only", async () => {
    expect(await callerFor().setCompanyRequired({ required: true })).toMatchObject({
      required: true,
    });
    expect(fake.state.companyUpdates).toHaveLength(1);
    expect(fake.state.companyUpdates[0]?.companyId).toBe(COMPANY);
    expect(fake.state.companyUpdates[0]?.set).toMatchObject({
      required: true,
      updatedBy: ME.id,
    });
    expect((await callerFor().status()).companyRequired).toBe(false);
    fake.state.companyRequires = true;
    expect((await callerFor().status()).companyRequired).toBe(true);
  });

  test("a member cannot", async () => {
    expect(
      await codeOf(callerFor({ role: "member" }).setCompanyRequired({ required: true })),
    ).toBe("FORBIDDEN");
    expect(fake.state.companyUpdates).toHaveLength(0);
    expect(fake.state.sessionsEnded).toEqual([]);
  });

  test("turning it on ends sessions and assistant keys of this company's password members without the app", async () => {
    // OTHER signs in with a password too, but in another company.
    const otherWithPassword = { ...WITH_PASSWORD, id: OTHER.id };
    fake = fakeTwoFactorDb([ME, otherWithPassword, WITH_PASSWORD, WITH_APP]);
    fake.state.members.set(COMPANY, [ME.id, WITH_PASSWORD.id, WITH_APP.id]);
    fake.state.members.set(OTHER.companyId, [OTHER.id]);
    appOn(WITH_APP.id);

    const saved = await callerFor().setCompanyRequired({ required: true });
    // ME signs in with Google, which asks for its own second factor; WITH_APP has the app.
    expect(fake.state.sessionsEnded).toEqual([WITH_PASSWORD.id]);
    expect(saved).toEqual({ required: true, sessionsEnded: 1, ownSessionEnded: false });
    expect(Object.keys(fake.state.userSets[0] ?? {}).sort()).toEqual([
      "mcpKeyVersion",
      "sessionVersion",
    ]);
    const audit = audits.find((a) => a.action === "company.updated");
    expect(audit).toMatchObject({ companyId: COMPANY, userId: ME.id });
    expect(audit?.newValue).toEqual({
      twoFactorRequired: true,
      sessionsEndedFor: [WITH_PASSWORD.id],
    });
  });

  test("an admin without the app is signed out with the others", async () => {
    fake.state.members.set(COMPANY, [WITH_PASSWORD.id]);
    const saved = await callerFor({ as: WITH_PASSWORD }).setCompanyRequired({
      required: true,
    });
    expect(saved.ownSessionEnded).toBe(true);
  });

  test("turning it off ends nobody's session", async () => {
    fake.state.members.set(COMPANY, [WITH_PASSWORD.id]);
    expect(await callerFor().setCompanyRequired({ required: false })).toEqual({
      required: false,
      sessionsEnded: 0,
      ownSessionEnded: false,
    });
    expect(fake.state.sessionsEnded).toEqual([]);
  });
});

describe("a platform admin's reset", () => {
  const reason = "Lost phone and printout, checked by phone call";

  test("a company admin who is no platform admin cannot reset anyone", async () => {
    expect(await codeOf(callerFor().adminReset({ userId: OTHER.id, reason }))).toBe(
      "FORBIDDEN",
    );
  });

  test("a platform admin cannot reset their own", async () => {
    platformAdmins.add(ME.email);
    expect(await codeOf(callerFor().adminReset({ userId: ME.id, reason }))).toBe(
      "FORBIDDEN",
    );
  });

  test("a platform admin resets someone else's, recorded with the reason under no company", async () => {
    appOn(OTHER.id);
    platformAdmins.add(ME.email);
    expect(await callerFor().adminReset({ userId: OTHER.id, reason })).toEqual({
      wasEnabled: true,
    });
    expect(fake.state.rows.has(OTHER.id)).toBe(false);
    expect(fake.state.sessionsEnded).toEqual([OTHER.id]);
    const row = audits.find((a) => a.action === "user.two_factor_reset");
    expect(row).toMatchObject({ userId: ME.id, entityId: OTHER.id, companyId: null });
    expect(row?.newValue).toEqual({ reason, wasEnabled: true });
  });
});

describe("an assistant's key", () => {
  test("reaches none of it", async () => {
    expect(await codeOf(callerFor({ viaKey: true }).status())).toBe("FORBIDDEN");
    expect(
      await codeOf(callerFor({ viaKey: true }).setCompanyRequired({ required: false })),
    ).toBe("FORBIDDEN");
  });
});
