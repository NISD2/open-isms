/**
 * The platform admin's list of active users and one person's details, and the test endpoint's key.
 * Pinned here: only a platform admin reads or makes any of it, the active window defaults to
 * fourteen days and takes the number the admin asks for, and a key needs a recent sign-in.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { DEFAULT_ACTIVE_DAYS, MAX_ACTIVE_DAYS } from "@/lib/platform-admin/active-window";

const ADMIN = "ops@example.com";
// Set here rather than through PLATFORM_ADMIN_EMAILS: other test files mock this module for the
// whole run.
mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [ADMIN],
  isPlatformAdmin: (email: string | null | undefined) => email === ADMIN,
  requirePlatformAdmin: async () => {},
}));

const { createCallerFactory } = await import("../init");
const { platformAdminUsersRouter } = await import("./platform-admin-users");
const { env } = await import("@/lib/env");
const { testInstanceKey } = await import("@/lib/test-mcp/context");
const { readTestKey } = await import("@/lib/test-mcp/key");
type TRPCContext = import("../init").TRPCContext;

const DAY_MS = 24 * 60 * 60 * 1000;
const dialect = new PgDialect();

const OPERATOR = "11111111-1111-4111-8111-111111111111";
const PERSON = "22222222-2222-4222-8222-222222222222";

/**
 * A caller signed in as `email` (at `authTime`, epoch seconds), over a database that records every
 * query's filter and answers `row` to a single-row read.
 */
function setup(
  email: string,
  row: unknown = null,
  authTime: number | null = null,
  viaKey = false,
  options: { readonly failInsert?: boolean } = {},
) {
  const wheres: SQL[] = [];
  const chain = {
    from: () => chain,
    leftJoin: () => chain,
    innerJoin: () => chain,
    where: (where: SQL) => {
      wheres.push(where);
      return chain;
    },
    orderBy: () => Object.assign(Promise.resolve([]), { limit: async () => [] }),
  };
  const inserted: unknown[] = [];
  const db = {
    select: () => chain,
    insert: () => ({
      values: async (row: unknown) => {
        if (options.failInsert) throw new Error("audit table unavailable");
        inserted.push(row);
      },
    }),
    query: {
      user: {
        findFirst: async ({ where }: { where: SQL }) => {
          wheres.push(where);
          return row;
        },
      },
    },
  };
  const caller = createCallerFactory(platformAdminUsersRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      accessLevel: "full",
      authTime,
      user: { id: OPERATOR, email },
    } as TRPCContext["session"],
    userId: OPERATOR,
    companyId: "44444444-4444-4444-8444-444444444444",
    ip: "test",
    userAgent: null,
    viaKey,
  } as TRPCContext);
  return { caller, wheres, inserted };
}

describe("active users (platform admin)", () => {
  test("is closed to anyone who is not a platform admin", async () => {
    const { caller, wheres } = setup("someone@example.com");
    await expect(caller.active()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(wheres).toEqual([]);
  });

  /** How far back the sign-in cutoff of the one query that ran reaches, in days. */
  const reachDays = (wheres: SQL[], now: number) => {
    const [cutoff] = dialect.sqlToQuery(wheres[0] as SQL).params as [string | Date];
    return (now - new Date(cutoff).getTime()) / DAY_MS;
  };

  test("keeps the sign-ins of the past fourteen days unless asked for another window", async () => {
    const { caller, wheres } = setup(ADMIN);
    const now = Date.now();
    await caller.active();
    expect(DEFAULT_ACTIVE_DAYS).toBe(14);
    expect(reachDays(wheres, now)).toBeCloseTo(14, 2);
  });

  test("looks back as many days as it is asked to", async () => {
    const { caller, wheres } = setup(ADMIN);
    const now = Date.now();
    await caller.active({ days: 30 });
    expect(reachDays(wheres, now)).toBeCloseTo(30, 2);
  });

  test("refuses a window of no days or of more than a year", async () => {
    const { caller, wheres } = setup(ADMIN);
    await expect(caller.active({ days: 0 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(caller.active({ days: MAX_ACTIVE_DAYS + 1 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(wheres).toEqual([]);
  });
});

describe("one user's details (platform admin)", () => {
  test("is closed to anyone who is not a platform admin", async () => {
    const { caller, wheres } = setup("someone@example.com");
    await expect(caller.detail({ id: PERSON })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(wheres).toEqual([]);
  });

  test("reads the account, its companies and its activity for that person only", async () => {
    const { caller, wheres } = setup(ADMIN, { id: PERSON, name: "Anna Beispiel" });
    const result = await caller.detail({ id: PERSON });
    expect(result?.person.name).toBe("Anna Beispiel");
    expect(wheres.map((w) => dialect.sqlToQuery(w).params)).toEqual([
      [PERSON],
      [PERSON],
      [PERSON],
    ]);
  });

  test("passes the two days to the activity query, and only to that one", async () => {
    const { caller, wheres } = setup(ADMIN, { id: PERSON, name: "Anna Beispiel" });
    await caller.detail({ id: PERSON, fromDay: "2026-10-01", toDay: "2026-10-31" });
    const params = wheres.map((w) => dialect.sqlToQuery(w).params);
    expect(params[0]).toEqual([PERSON]);
    expect(params[1]).toEqual([PERSON]);
    expect(params[2]).toContain("2026-10-01");
    expect(params[2]).toContain("2026-10-31");
    expect(params[2]).toContain(PERSON);
  });

  test("refuses a start day after the end day without reading anything", async () => {
    const { caller, wheres } = setup(ADMIN, { id: PERSON, name: "Anna Beispiel" });
    await expect(
      caller.detail({ id: PERSON, fromDay: "2026-11-01", toDay: "2026-10-01" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(wheres).toEqual([]);
  });

  test("names nobody for an id no account has, an erased one included", async () => {
    const { caller } = setup(ADMIN, null);
    expect(await caller.detail({ id: PERSON })).toBeNull();
  });
});

describe("the test endpoint's key (platform admin)", () => {
  const nowS = () => Math.floor(Date.now() / 1000);
  const versions = { mcpKeyVersion: 3, sessionVersion: 7 };

  /** Runs `body` with TEST_MCP_PATH set (or unset) and puts the old value back after. */
  async function withPath(path: string | undefined, body: () => Promise<void>) {
    const before = env.TEST_MCP_PATH;
    env.TEST_MCP_PATH = path;
    try {
      await body();
    } finally {
      env.TEST_MCP_PATH = before;
    }
  }

  test("is closed to anyone who is not a platform admin", async () => {
    await withPath("p".repeat(48), async () => {
      const { caller, wheres } = setup("someone@example.com", versions, nowS());
      await expect(caller.createTestKey()).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(wheres).toEqual([]);
    });
  });

  test("says so when no address is set on the instance", async () => {
    await withPath(undefined, async () => {
      const { caller, wheres } = setup(ADMIN, versions, nowS());
      await expect(caller.createTestKey()).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });
      expect(wheres).toEqual([]);
    });
  });

  test("asks for a fresh sign-in, with no sign-in time at all or one that is too old", async () => {
    await withPath("p".repeat(48), async () => {
      for (const authTime of [null, nowS() - 20 * 60]) {
        const { caller, wheres } = setup(ADMIN, versions, authTime);
        await expect(caller.createTestKey()).rejects.toMatchObject({
          code: "FORBIDDEN",
          message: "reauth",
        });
        expect(wheres).toEqual([]);
      }
    });
  });

  test("makes a key that carries the person's key and sign-in versions, and the address to use it at", async () => {
    const path = "p".repeat(48);
    await withPath(path, async () => {
      const { caller } = setup(ADMIN, versions, nowS() - 60);
      const made = await caller.createTestKey();
      const claims = readTestKey(testInstanceKey(), made.key, nowS());
      expect(claims).toMatchObject({ sub: OPERATOR, ver: 3, sv: 7 });
      expect(made.url.endsWith(`/api/t/${path}`)).toBe(true);
      expect(made.hours).toBe(4);
    });
  });

  test("makes nothing for an account that no longer exists", async () => {
    await withPath("p".repeat(48), async () => {
      const { caller } = setup(ADMIN, null, nowS());
      await expect(caller.createTestKey()).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});

describe("the test endpoint's browser sign-in (platform admin)", () => {
  const nowS = () => Math.floor(Date.now() / 1000);
  const versions = { mcpKeyVersion: 3, sessionVersion: 7 };
  const PATH = "p".repeat(48);
  const REDIRECT = "http://localhost:4123/callback";

  async function withPath(path: string | undefined, body: () => Promise<void>) {
    const before = env.TEST_MCP_PATH;
    env.TEST_MCP_PATH = path;
    try {
      await body();
    } finally {
      env.TEST_MCP_PATH = before;
    }
  }

  /** What the consent page receives from a client that asked for `resource`. */
  async function requestFor(resource: string): Promise<string> {
    const { instanceKey } = await import("@/lib/mcp/instance-key");
    const { authorize, registerClient } = await import("@/lib/mcp/oauth");
    const { testResource } = await import("@/lib/test-mcp/address");
    const registered = registerClient(
      instanceKey(),
      { redirect_uris: [REDIRECT], client_name: "Claude Code" },
      nowS(),
    );
    if (!registered.ok) throw new Error(registered.description);
    const outcome = authorize(
      instanceKey(),
      new URLSearchParams({
        response_type: "code",
        client_id: String(registered.client.client_id),
        redirect_uri: REDIRECT,
        code_challenge: "c".repeat(43),
        code_challenge_method: "S256",
        state: "xyz",
        resource,
      }),
      "https://example.test/api/mcp",
      nowS(),
      testResource(PATH),
    );
    if (outcome.kind !== "consent") throw new Error(outcome.message);
    return outcome.request;
  }

  const forTest = async () => {
    const { testResource } = await import("@/lib/test-mcp/address");
    return requestFor(testResource(PATH));
  };

  test("only a platform admin can allow it or ask for the address", async () => {
    await withPath(PATH, async () => {
      const request = await forTest();
      const { caller, wheres } = setup("someone@example.com", versions, nowS());
      await expect(caller.allowTestClient({ request })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.testAddress()).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(wheres).toEqual([]);
    });
  });

  test("an assistant's key cannot allow it either, not even the operator's own", async () => {
    await withPath(PATH, async () => {
      const request = await forTest();
      const { caller, wheres } = setup(ADMIN, versions, nowS(), true);
      await expect(caller.allowTestClient({ request })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(wheres).toEqual([]);
    });
  });

  test("allows nothing while no address is set on the instance", async () => {
    await withPath(undefined, async () => {
      const { caller, wheres } = setup(ADMIN, versions, nowS());
      await expect(caller.allowTestClient({ request: "x" })).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });
      await expect(caller.testAddress()).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });
      expect(wheres).toEqual([]);
    });
  });

  test("asks for a fresh sign-in, with none at all or one that is too old", async () => {
    await withPath(PATH, async () => {
      const request = await forTest();
      for (const authTime of [null, nowS() - 20 * 60]) {
        const { caller, wheres } = setup(ADMIN, versions, authTime);
        await expect(caller.allowTestClient({ request })).rejects.toMatchObject({
          code: "FORBIDDEN",
          message: "reauth",
        });
        expect(wheres).toEqual([]);
      }
    });
  });

  test("refuses a request that expired or never was one, and one made for the customer's endpoint", async () => {
    await withPath(PATH, async () => {
      const { caller, wheres } = setup(ADMIN, versions, nowS() - 60);
      await expect(caller.allowTestClient({ request: "nonsense" })).rejects.toMatchObject(
        {
          code: "BAD_REQUEST",
        },
      );
      const customer = await requestFor("https://example.test/api/mcp");
      await expect(caller.allowTestClient({ request: customer })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(wheres).toEqual([]);
    });
  });

  test("records who allowed which application and where it went back to, before it hands a code out", async () => {
    await withPath(PATH, async () => {
      const request = await forTest();
      const { caller, inserted } = setup(ADMIN, versions, nowS() - 60);
      const { url } = await caller.allowTestClient({ request });
      expect(inserted).toHaveLength(1);
      expect(inserted[0]).toMatchObject({
        companyId: null,
        userId: OPERATOR,
        action: "test.connect",
        entityType: "platformAdmin",
        description: "test: Claude Code, back to localhost:4123",
        newValue: { client: "Claude Code", returnHost: "localhost:4123" },
      });
      // Neither the code nor any key is in the row.
      const code = new URL(url).searchParams.get("code") ?? "no code";
      expect(JSON.stringify(inserted[0])).not.toContain(code);
    });
  });

  test("hands out no code when the record cannot be written", async () => {
    await withPath(PATH, async () => {
      const request = await forTest();
      const { caller } = setup(ADMIN, versions, nowS() - 60, false, { failInsert: true });
      await expect(caller.allowTestClient({ request })).rejects.toThrow(
        "audit table unavailable",
      );
    });
  });

  test("sends the browser back with a code that holds the person's versions of now, and the state", async () => {
    await withPath(PATH, async () => {
      const request = await forTest();
      const { caller } = setup(ADMIN, versions, nowS() - 60);
      const { url } = await caller.allowTestClient({ request });
      const back = new URL(url);
      expect(`${back.origin}${back.pathname}`).toBe("http://localhost:4123/callback");
      expect(back.searchParams.get("state")).toBe("xyz");
      const [, payload] = (back.searchParams.get("code") ?? "").split(".");
      expect(
        JSON.parse(Buffer.from(payload ?? "", "base64url").toString()),
      ).toMatchObject({
        aud: "mcp_test_code",
        sub: OPERATOR,
        ver: 3,
        sv: 7,
      });
    });
  });

  test("shows the address to the operator", async () => {
    await withPath(PATH, async () => {
      const { caller } = setup(ADMIN, versions, nowS());
      const { url } = await caller.testAddress();
      expect(url.endsWith(`/api/t/${PATH}`)).toBe(true);
    });
  });
});
