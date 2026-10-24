import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

process.env.SKIP_ENV_VALIDATION = "1";

const ADMIN_EMAIL = "admin@example.com";

mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [ADMIN_EMAIL],
  isPlatformAdmin: (email: string | null | undefined) => email === ADMIN_EMAIL,
  requirePlatformAdmin: async () => {},
}));

const { createCallerFactory } = await import("../init");
const { platformAdminUpdatesRouter } = await import("./platform-admin-updates");
type TRPCContext = import("../init").TRPCContext;

const createCaller = createCallerFactory(platformAdminUpdatesRouter);

function makeContext(email: string | null): TRPCContext {
  const isUser = Boolean(email);
  return {
    userId: isUser ? "user-1" : null,
    session: isUser
      ? ({
          role: "admin",
          accessLevel: "full",
          user: { id: "user-1", email },
        } as unknown as TRPCContext["session"])
      : null,
    companyId: "comp-1",
    ip: "127.0.0.1",
    userAgent: null,
    viaKey: false,
    db: {
      insert: () => ({
        values: async () => {},
      }),
    } as unknown as TRPCContext["db"],
  };
}

describe("platformAdminUpdatesRouter", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SKIP_ENV_VALIDATION = "1";
    process.env.UPDATE_MODE = "off";
    process.env.APP_VERSION = "0.2.11";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("refuses non-admin user", async () => {
    const caller = createCaller(makeContext("regular-user@example.com"));
    await expect(caller.status()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.trigger()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("refuses unauthenticated caller", async () => {
    const caller = createCaller(makeContext(null));
    await expect(caller.status()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.trigger()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("allows platform admin to query update status", async () => {
    const caller = createCaller(makeContext(ADMIN_EMAIL));
    const status = await caller.status();
    expect(status.mode).toBe("off");
    expect(status.currentVersion).toBe("0.2.11");
    expect(status.hasUpdate).toBe(false);
  });

  test("allows platform admin to trigger updater mutation", async () => {
    const caller = createCaller(makeContext(ADMIN_EMAIL));
    delete process.env.UPDATE_API_TOKEN;
    const res = await caller.trigger();
    expect(res.ok).toBe(false);
    expect(res.message).toContain("UPDATE_API_TOKEN is not configured");
  });
});
