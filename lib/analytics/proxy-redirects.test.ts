import { afterAll, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

/**
 * What the proxy does with a visitor who has no session: the redirects that send them to sign-in
 * or to a public lander. Both rebuild the URL, so both used to drop the request's query, and with
 * it the campaign tags a page's link had handed on.
 *
 * The proxy reads lib/env, which refuses to load without a database address and an auth secret.
 * Dummy values are set before it is imported (nothing connects to anything here) and put back
 * afterwards for the files that run after this one, as lib/auth/session-lifecycle.test.ts does.
 */
const saved = {
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
};
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret-0123";
const { proxy } = await import("@/proxy");
afterAll(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const visit = (path: string) => proxy(new NextRequest(`https://nisd2.eu${path}`));

const redirectTo = (response: Response) => {
  expect(response.status).toBe(307);
  return new URL(response.headers.get("location") ?? "");
};

describe("proxy, visitor without a session", () => {
  test("a gated lesson goes to sign-in with the page it was for and the source tags", async () => {
    const to = redirectTo(
      await visit(
        "/training/courses/nis2-ceo/0.1?utm_source=linkedin&utm_medium=social&from_path=%2Ftraining%2Fnis2-ceo",
      ),
    );
    expect(to.pathname).toBe("/auth/signin");
    expect(Object.fromEntries(to.searchParams)).toEqual({
      callbackUrl: "/training/courses/nis2-ceo/0.1",
      utm_source: "linkedin",
      utm_medium: "social",
      from_path: "/training/nis2-ceo",
    });
  });

  test("only the source tags travel: every other key stays behind", async () => {
    const to = redirectTo(
      await visit(
        "/training/courses/nis2-ceo/0.1?token=abc&email=a%40b.de&utm_term=nis2",
      ),
    );
    expect(Object.fromEntries(to.searchParams)).toEqual({
      callbackUrl: "/training/courses/nis2-ceo/0.1",
      utm_term: "nis2",
    });
  });

  test("a clicked page that is a credential link or off site is not passed on", async () => {
    for (const from of ["/invite/5f0c", "//evil.example/x", "https://evil.example/x"]) {
      const to = redirectTo(
        await visit(`/training/courses?from_path=${encodeURIComponent(from)}`),
      );
      expect(to.searchParams.has("from_path")).toBe(false);
    }
  });

  test("a request without tags goes to sign-in with the page it was for, as before", async () => {
    const to = redirectTo(await visit("/training/courses/nis2-ceo/0.1"));
    expect(to.search).toBe("?callbackUrl=%2Ftraining%2Fcourses%2Fnis2-ceo%2F0.1");
  });

  test("a protected root that has a public lander keeps the tags on the way there", async () => {
    const to = redirectTo(await visit("/journey?utm_source=google&utm_medium=cpc&x=1"));
    expect(to.pathname).toBe("/start");
    expect(Object.fromEntries(to.searchParams)).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
    });
  });

  test("a public page is not redirected", async () => {
    const response = await visit("/preise?utm_source=newsletter");
    expect(response.status).toBeLessThan(300);
  });
});
