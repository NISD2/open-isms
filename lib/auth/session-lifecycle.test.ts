import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

/**
 * A session cookie that has gone stale must stop working everywhere, and must
 * not be able to hurt the sessions that replaced it.
 *
 * Driven through the real Auth.js handlers (lib/auth/config.ts), because the
 * behaviour under test is the library's as much as ours: a jwt callback that
 * returns null is only useful if Auth.js then clears the cookie instead of
 * re-signing it, and auth() reads the same session action, so what
 * /api/auth/session answers here is what PublicNav sees. Only the database is
 * a stand-in.
 */

const SECRET = "test-secret-test-secret-test-secret-0123";
const ORIGIN = "http://localhost:3000";
// Auth.js names the cookie by the origin's protocol: plain http here.
const SESSION_COOKIE = "authjs.session-token";
const CSRF_COOKIE = "authjs.csrf-token";
const EMAIL = "owner@customer.example";
const HOUR = 60 * 60;

const state: {
  storedVersion: number | undefined;
  updates: Array<{ set: Record<string, unknown>; where: SQL }>;
} = { storedVersion: 1, updates: [] };

// Auth.js reads its secret and origin from process.env when NextAuth() is
// called and on each request, so both are set before config.ts loads and put
// back afterwards for the files that run after this one.
const saved = { AUTH_SECRET: process.env.AUTH_SECRET, AUTH_URL: process.env.AUTH_URL };
process.env.AUTH_SECRET = SECRET;
process.env.AUTH_URL = ORIGIN;
afterAll(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: SECRET,
    NEXT_PUBLIC_APP_URL: ORIGIN,
  },
  mailSupportEmail: () => "support@example.test",
}));

mock.module("@/lib/db", () => ({
  db: {
    query: {
      user: {
        findFirst: async () =>
          state.storedVersion === undefined
            ? undefined
            : { sessionVersion: state.storedVersion },
      },
    },
    update: () => ({
      set: (set: Record<string, unknown>) => ({
        where: async (where: SQL) => {
          state.updates.push({ set, where });
        },
      }),
    }),
  },
}));

// events.signOut also clears the promo cookie through next/headers, which only
// exists inside a Next.js request.
const nextHeaders = await import("next/headers");
mock.module("next/headers", () => ({
  ...nextHeaders,
  cookies: async () => ({ get: () => undefined, delete: () => {} }),
}));

const { NextRequest, NextResponse } = await import("next/server");
const { encode } = await import("next-auth/jwt");
const { handlers } = await import("./config");

const now = () => Math.floor(Date.now() / 1000);

function sessionCookie(claims: { authTime?: number; sessionVersion?: number }) {
  return encode({
    token: { email: EMAIL, ...claims },
    secret: SECRET,
    salt: SESSION_COOKIE,
    maxAge: 8 * HOUR,
  });
}

/**
 * The cookies a response sets, read with Next's own Set-Cookie parser. It
 * leaves out an empty value and a zero Max-Age, so a cleared cookie reads as
 * present with no value.
 */
function setCookies(response: Response) {
  return new NextResponse(null, { headers: response.headers }).cookies;
}

function expectCleared(cookie: { value?: string } | undefined) {
  expect(cookie).toBeDefined();
  expect(cookie?.value ?? "").toBe("");
}

async function readSession(jwt: string) {
  const response = await handlers.GET(
    new NextRequest(`${ORIGIN}/api/auth/session`, {
      headers: { cookie: `${SESSION_COOKIE}=${jwt}` },
    }),
  );
  return {
    body: await response.json(),
    cookie: setCookies(response).get(SESSION_COOKIE),
  };
}

async function signOut(jwt: string) {
  const csrf = await handlers.GET(new NextRequest(`${ORIGIN}/api/auth/csrf`));
  const { csrfToken } = (await csrf.json()) as { csrfToken: string };
  const csrfCookie = setCookies(csrf).get(CSRF_COOKIE)?.value ?? "";
  return handlers.POST(
    new NextRequest(`${ORIGIN}/api/auth/signout`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: `${CSRF_COOKIE}=${csrfCookie}; ${SESSION_COOKIE}=${jwt}`,
      },
      body: new URLSearchParams({ csrfToken }).toString(),
    }),
  );
}

beforeEach(() => {
  state.storedVersion = 1;
  state.updates.splice(0);
});

describe("reading a session re-signs only a live token", () => {
  test("a current token comes back and its cookie is renewed", async () => {
    const { body, cookie } = await readSession(
      await sessionCookie({ authTime: now() - HOUR, sessionVersion: 1 }),
    );
    expect(body?.user?.email).toBe(EMAIL);
    expect(cookie?.value ?? "").not.toBe("");
  });

  const stale = [
    ["older than twelve hours", { authTime: now() - 13 * HOUR, sessionVersion: 1 }, 1],
    [
      "revoked by a later reset or sign-out",
      { authTime: now() - HOUR, sessionVersion: 1 },
      2,
    ],
    ["without a sign-in time", { sessionVersion: 1 }, 1],
    ["without a revocation counter", { authTime: now() - HOUR }, 1],
    [
      "for an account that no longer exists",
      { authTime: now() - HOUR, sessionVersion: 1 },
      undefined,
    ],
  ] as const;
  for (const [name, claims, storedVersion] of stale) {
    test(`a token ${name} gets no session and its cookie is cleared`, async () => {
      state.storedVersion = storedVersion;
      const { body, cookie } = await readSession(await sessionCookie(claims));
      expect(body).toBeNull();
      expectCleared(cookie);
    });
  }
});

describe("signing out", () => {
  const dialect = new PgDialect();

  test("a live token revokes the account's sessions, conditional on its own version", async () => {
    await signOut(await sessionCookie({ authTime: now() - HOUR, sessionVersion: 3 }));
    expect(state.updates).toHaveLength(1);
    const where = dialect.sqlToQuery(state.updates[0].where);
    // Both conditions reach the database: the address, and the version the token carries.
    expect(where.params).toEqual([EMAIL, 3]);
    expect(where.sql).toContain('"session_version" = $2');
  });

  test("a token past twelve hours revokes nothing", async () => {
    await signOut(
      await sessionCookie({ authTime: now() - 13 * HOUR, sessionVersion: 1 }),
    );
    expect(state.updates).toEqual([]);
  });

  test("a token without a revocation counter revokes nothing", async () => {
    await signOut(await sessionCookie({ authTime: now() - HOUR }));
    expect(state.updates).toEqual([]);
  });

  test("the sign-out still clears this browser's cookie", async () => {
    const response = await signOut(
      await sessionCookie({ authTime: now() - 13 * HOUR, sessionVersion: 1 }),
    );
    expectCleared(setCookies(response).get(SESSION_COOKIE));
  });
});
