import { describe, expect, test } from "bun:test";
import { loadPulse, loadTraffic } from "./umami";
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
    "/stats": () =>
      json({
        pageviews: 540,
        visitors: 150,
        visits: 200,
        bounces: 150,
        totaltime: 24_000,
        comparison: {
          pageviews: 400,
          visitors: 100,
          visits: 160,
          bounces: 120,
          totaltime: 16_000,
        },
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
  test("folds the answers into totals, days, pages and referrers", async () => {
    const { fetchFn } = fakeUmami();
    expect(await loadTraffic(config, window, fetchFn)).toEqual({
      ok: true,
      traffic: {
        stats: {
          visits: 200,
          bounces: 150,
          pageviews: 540,
          totaltime: 24_000,
          previous: { visits: 160, bounces: 120, pageviews: 400, totaltime: 16_000 },
        },
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
      error: "path: unexpected response",
    });
  });

  test("no comparison from the host means no previous period, not zeros", async () => {
    const { fetchFn } = fakeUmami({
      "/stats": () =>
        json({ pageviews: 5, visitors: 2, visits: 3, bounces: 1, totaltime: 90 }),
    });
    const result = await loadTraffic(config, window, fetchFn);
    expect(result.ok && result.traffic.stats.previous).toBeNull();
  });

  test("a network error is a failure and never throws", async () => {
    const result = await loadTraffic(config, window, async () => {
      throw new Error("connect ECONNREFUSED");
    });
    expect(result).toEqual({ ok: false, error: "connect ECONNREFUSED" });
  });
});

describe("loadPulse", () => {
  const week = (from: string, to: string) => ({ from, to });
  const weeks = [
    week("2026-10-09", "2026-10-15"),
    week("2026-10-02", "2026-10-08"),
    week("2026-09-25", "2026-10-01"),
  ];

  /** Answers by what was asked: the country filter, the metric type, or the plain totals. */
  const routed = () => {
    const calls: URL[] = [];
    const fetchFn = async (input: string) => {
      const url = new URL(input);
      calls.push(url);
      if (url.pathname === "/api/auth/login") return json({ token: "synthetic-token" });
      const q = url.searchParams;
      if (url.pathname.endsWith("/metrics")) {
        return q.get("startAt") === String(Date.parse("2026-09-25T00:00:00Z"))
          ? json([
              { x: "DE", y: 400 },
              { x: "HK", y: 6 },
            ])
          : json([
              { x: "DE", y: 230 },
              { x: "HK", y: 111 },
            ]);
      }
      const country = q.get("country");
      if (country === "HK")
        return json({
          pageviews: 117,
          visitors: 100,
          visits: 113,
          bounces: 110,
          totaltime: 0,
        });
      if (country === "DE")
        return json({
          pageviews: 900,
          visitors: 200,
          visits: 230,
          bounces: 120,
          totaltime: 60_000,
        });
      return json({
        pageviews: 1000,
        visitors: 300,
        visits: 400,
        bounces: 250,
        totaltime: 70_000,
      });
    };
    return { fetchFn, calls };
  };

  test("lays out this week, the baseline weeks and the countries with their single-page share", async () => {
    const { fetchFn } = routed();
    const result = await loadPulse(config, weeks, fetchFn);
    expect(result).toEqual({
      ok: true,
      pulse: {
        thisWeek: { from: "2026-10-09", to: "2026-10-15", visits: 400, bounces: 250 },
        baselineWeeks: [
          { from: "2026-10-02", to: "2026-10-08", visits: 400, bounces: 250 },
          { from: "2026-09-25", to: "2026-10-01", visits: 400, bounces: 250 },
        ],
        countries: [
          { code: "DE", count: 230, visits: 230, bounces: 120 },
          { code: "HK", count: 111, visits: 113, bounces: 110 },
        ],
        countriesBefore: [
          { code: "DE", count: 400 },
          { code: "HK", count: 6 },
        ],
      },
    });
  });

  test("the baseline country count spans every baseline week at once", async () => {
    const { fetchFn, calls } = routed();
    await loadPulse(config, weeks, fetchFn);
    const spans = calls
      .filter((url) => url.pathname.endsWith("/metrics"))
      .map((url) => [url.searchParams.get("startAt"), url.searchParams.get("endAt")]);
    expect(spans).toContainEqual([
      String(Date.parse("2026-09-25T00:00:00Z")),
      String(Date.parse("2026-10-09T00:00:00Z") - 1),
    ]);
  });

  test("one failed call fails the pulse, and a pulse without a baseline is refused", async () => {
    const failing = await loadPulse(config, weeks, async (input: string) =>
      input.includes("/api/auth/login") ? json({ token: "t" }) : json({}, 500),
    );
    expect(failing.ok).toBe(false);
    expect(
      await loadPulse(config, [weeks[0] as { from: string; to: string }], fetch),
    ).toEqual({
      ok: false,
      error: "pulse: needs a week and a baseline",
    });
  });
});
