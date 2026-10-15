/**
 * What connecting an AI assistant asks (lib/mcp), pinned because each refusal is a promise made
 * elsewhere: an assistant cannot make itself a key or allow another one, nobody gets a key for a
 * walkthrough their plan does not hold, a key or an assistant's sign-in outlives the browser
 * session it was made in so it asks for a fresh sign-in, and a key never operates the platform.
 * Every refusal comes before the database (`db` here throws if anything reaches it).
 */
import { describe, expect, mock, test } from "bun:test";

const OPERATOR = "operator@example.com";

// The router reaches lib/db and lib/auth, which read a validated env as they load; CI has none.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
// The auto-audit middleware files a row for every mutation, refused ones included.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
// Set here rather than through PLATFORM_ADMIN_EMAILS: another test file mocks this module for
// the whole run.
mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [OPERATOR],
  isPlatformAdmin: (email: string | null | undefined) => email === OPERATOR,
  requirePlatformAdmin: async () => {},
}));

const { createCallerFactory, platformAdminProcedure, protectedProcedure, router } =
  await import("../init");
const { userRouter } = await import("./user");
type TRPCContext = import("../init").TRPCContext;
const NOW_S = Math.floor(Date.now() / 1000);
const COMPANY = "33333333-3333-4333-8333-333333333333";

const REFUSING_DB = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(`a refused call touched the database: .${String(prop)}`);
    },
  },
);

type Session = NonNullable<TRPCContext["session"]>;

function contextWith(
  session: Partial<Session> & { user?: Partial<Session["user"]> },
  viaKey = false,
): TRPCContext {
  return {
    db: REFUSING_DB as TRPCContext["db"],
    session: {
      role: "admin",
      accessLevel: "full",
      authTime: NOW_S,
      ...session,
      user: { id: "u1", email: "person@example.com", name: null, ...session.user },
    } as Session,
    userId: "u1",
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
    viaKey,
  } as TRPCContext;
}

/** Both ways to connect, each started only when awaited. */
const connect = (ctx: TRPCContext) => {
  const caller = createCallerFactory(userRouter)(ctx);
  return [
    () => caller.createMcpKey({ companyId: COMPANY }),
    () => caller.allowMcpClient({ request: "x", companyId: COMPANY }),
  ];
};

describe("connecting an assistant", () => {
  test("an assistant's key cannot make a key or allow another assistant", async () => {
    for (const call of connect(contextWith({}, true))) {
      await expect(call()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  test("a plan without the walkthrough gets no key, on the server as on the page", async () => {
    for (const call of connect(contextWith({ accessLevel: "grandfathered" }))) {
      await expect(call()).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "The Durchgang is not part of this plan.",
      });
    }
  });

  test("a sign-in older than a few minutes is sent to sign in again", async () => {
    for (const authTime of [NOW_S - 60 * 60, null]) {
      for (const call of connect(contextWith({ authTime }))) {
        await expect(call()).rejects.toMatchObject({
          code: "FORBIDDEN",
          message: "reauth",
        });
      }
    }
  });

  test("a key or code is made only for the company the page showed", async () => {
    const caller = createCallerFactory(userRouter)(contextWith({}));
    const other = "44444444-4444-4444-8444-444444444444";
    await expect(caller.createMcpKey({ companyId: other })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      caller.allowMcpClient({ request: "x", companyId: other }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("no key and no sign-in while the company's admin has not allowed assistants", async () => {
    const offDb = {
      query: { company: { findFirst: async () => ({ assistantsAllowed: false }) } },
    };
    const ctx = { ...contextWith({}), db: offDb as unknown as TRPCContext["db"] };
    for (const call of connect(ctx)) {
      await expect(call()).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "assistants_off",
      });
    }
  });

  test("a key reaches only the procedures on the MCP list, refused before anything runs", async () => {
    const viaKey = createCallerFactory(userRouter)(contextWith({}, true));
    await expect(viaKey.disconnectMcp()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Not available to an assistant.",
    });
    const probe = router({
      durchgang: router({ walk: protectedProcedure.query(() => "walked") }),
      billing: router({ place: protectedProcedure.mutation(() => "placed") }),
    });
    const caller = createCallerFactory(probe)(contextWith({}, true));
    expect(await caller.durchgang.walk()).toBe("walked");
    await expect(caller.billing.place()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("a key never operates the platform, not even the operator's own", async () => {
    const probe = router({ op: platformAdminProcedure.query(() => "operated") });
    const operator = { user: { email: OPERATOR } };
    expect(await createCallerFactory(probe)(contextWith(operator)).op()).toBe("operated");
    await expect(
      createCallerFactory(probe)(contextWith(operator, true)).op(),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
