import { describe, expect, test } from "bun:test";
import { loadTraffic } from "./umami";
import { umamiConfig } from "./umami-config";

const SITE = "0b1f6a52-3c1e-4a57-9d6e-2a9e5a4f7c10";

const complete = {
  ANALYTICS_SCRIPT_URL: "https://analytics.example.test/script.js",
  ANALYTICS_WEBSITE_ID: SITE,
  ANALYTICS_API_USERNAME: "viewer",
  ANALYTICS_API_PASSWORD: "synthetic-password",
};

describe("umamiConfig", () => {
  test("reads the host from the script URL, so the login goes to exactly one origin", () => {
    expect(umamiConfig(complete)).toEqual({
      baseUrl: "https://analytics.example.test",
      websiteId: SITE,
      username: "viewer",
      password: "synthetic-password",
    });
  });

  test("is off unless all four settings are present", () => {
    for (const missing of Object.keys(complete)) {
      expect(umamiConfig({ ...complete, [missing]: undefined })).toBeNull();
    }
  });

  test("is off for a plain-http host, a malformed URL or a site id that is not a uuid", () => {
    expect(
      umamiConfig({
        ...complete,
        ANALYTICS_SCRIPT_URL: "http://analytics.example.test/s.js",
      }),
    ).toBeNull();
    expect(umamiConfig({ ...complete, ANALYTICS_SCRIPT_URL: "not a url" })).toBeNull();
    expect(umamiConfig({ ...complete, ANALYTICS_WEBSITE_ID: "abc" })).toBeNull();
  });
});

const config = umamiConfig(complete);
if (config === null) throw new Error("test config must be valid");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const window = { from: "2026-10-10", to: "2026-10-11" };

/** A fake Umami that answers by path and records every URL it was asked for. */
const fakeUmami = (overrides: Partial<Record<string, () => Response>> = {}) => {
  const calls: string[] = [];
  const answers: Record<string, () => Response> = {
    "/api/auth/login": () => json({ token: "synthetic-token" }),
    pageviews: () =>
      json({
        pageviews: [
          { x: "2026-10-10 00:00:00", y: 60 },
          { x: "2026-10-11 00:00:00", y: 480 },
        ],
        sessions: [{ x: "2026-10-11 00:00:00", y: 132 }],
      }),
    "type=path": () => json([{ x: "/en/pricing", y: 146 }]),
    "type=referrer": () => json([{ x: "google.com", y: 190 }]),
    ...overrides,
  };
  const fetchFn = async (input: string) => {
    calls.push(input);
    const key = Object.keys(answers).find((k) => input.includes(k));
    return key === undefined ? json({}, 404) : (answers[key]?.() ?? json({}, 404));
  };
  return { fetchFn, calls };
};

describe("loadTraffic", () => {
  test("folds the three answers into days, pages and referrers", async () => {
    const { fetchFn } = fakeUmami();
    expect(await loadTraffic(config, window, fetchFn)).toEqual({
      ok: true,
      traffic: {
        days: [
          { day: "2026-10-10", pageviews: 60, sessions: 0 },
          { day: "2026-10-11", pageviews: 480, sessions: 132 },
        ],
        pages: [{ name: "/en/pricing", views: 146 }],
        referrers: [{ name: "google.com", views: 190 }],
      },
    });
  });

  test("asks for whole UTC days and sends the login only to the configured origin", async () => {
    const { fetchFn, calls } = fakeUmami();
    await loadTraffic(config, window, fetchFn);
    expect(
      calls.every((url) => url.startsWith("https://analytics.example.test/api/")),
    ).toBe(true);
    const query = new URL(calls.find((url) => url.includes("pageviews")) ?? "")
      .searchParams;
    expect(query.get("startAt")).toBe(String(Date.parse("2026-10-10T00:00:00Z")));
    expect(query.get("endAt")).toBe(String(Date.parse("2026-10-12T00:00:00Z") - 1));
    expect(query.get("timezone")).toBe("UTC");
  });

  test("a refused login is a failure, not data", async () => {
    const { fetchFn } = fakeUmami({
      "/api/auth/login": () => json({ error: "no" }, 401),
    });
    expect(await loadTraffic(config, window, fetchFn)).toEqual({
      ok: false,
      error: "login: HTTP 401",
    });
  });

  test("a 200 with an HTML body is a failure", async () => {
    const { fetchFn } = fakeUmami({
      "type=path": () => new Response("<html>proxy error</html>"),
    });
    expect(await loadTraffic(config, window, fetchFn)).toEqual({
      ok: false,
      error: "pages: unexpected response",
    });
  });

  test("a network error is a failure and never throws", async () => {
    const result = await loadTraffic(config, window, async () => {
      throw new Error("connect ECONNREFUSED");
    });
    expect(result).toEqual({ ok: false, error: "connect ECONNREFUSED" });
  });
});
