import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  clearReleaseCache,
  compareSemver,
  getUpdateStatus,
  parseExpectedComposeRevision,
  parseSemver,
  triggerUpdater,
} from "./checker";

describe("semver helpers", () => {
  test("parseSemver handles diverse version shapes", () => {
    expect(parseSemver("0.2.11")).toEqual([0, 2, 11]);
    expect(parseSemver("v0.2.11")).toEqual([0, 2, 11]);
    expect(parseSemver("  v1.5.0-alpha.1  ")).toEqual([1, 5, 0]);
    expect(parseSemver("dev")).toBeNull();
    expect(parseSemver("invalid")).toBeNull();
  });

  test("compareSemver orders versions correctly", () => {
    expect(compareSemver("0.2.11", "0.2.10")).toBe(1);
    expect(compareSemver("v0.2.11", "v0.2.11")).toBe(0);
    expect(compareSemver("0.2.10", "0.2.11")).toBe(-1);
    expect(compareSemver("1.0.0", "0.9.9")).toBe(1);
    expect(compareSemver("0.3.0", "0.2.15")).toBe(1);
  });
});

describe("parseExpectedComposeRevision", () => {
  test("extracts expected compose revision from release notes", () => {
    expect(
      parseExpectedComposeRevision("Requires COMPOSE_REVISION: 4 for the new service"),
    ).toBe(4);
    expect(parseExpectedComposeRevision("Notes: COMPOSE_REVISION=5\nDetails below")).toBe(
      5,
    );
    expect(parseExpectedComposeRevision("compose revision: 3")).toBe(3);
    expect(parseExpectedComposeRevision("Please update compose.yaml revision 4")).toBe(4);
  });

  test("returns null when no compose revision requirement is mentioned", () => {
    expect(parseExpectedComposeRevision(null)).toBeNull();
    expect(
      parseExpectedComposeRevision("Ordinary bug fixes and improvements"),
    ).toBeNull();
  });
});

describe("getUpdateStatus", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearReleaseCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("mode='off' makes no outbound requests and returns current info", async () => {
    process.env.UPDATE_MODE = "off";
    process.env.APP_VERSION = "0.2.10";
    process.env.COMPOSE_REVISION = "3";

    let fetchCalled = false;
    const mockFetch = (async () => {
      fetchCalled = true;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    const status = await getUpdateStatus({ fetchFn: mockFetch });

    expect(fetchCalled).toBe(false);
    expect(status.mode).toBe("off");
    expect(status.currentVersion).toBe("0.2.10");
    expect(status.currentComposeRevision).toBe(3);
    expect(status.hasUpdate).toBe(false);
    expect(status.latestVersion).toBeNull();
    expect(status.lastCheckedAt).toBeNull();
  });

  test("mode='notify' queries releases API, compares version and caches result", async () => {
    process.env.UPDATE_MODE = "notify";
    process.env.APP_VERSION = "0.2.10";
    process.env.COMPOSE_REVISION = "3";

    let fetchCount = 0;
    let requestedUrl = "";
    let userAgent = "";

    const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      fetchCount += 1;
      requestedUrl = String(url);
      const headers = (init?.headers ?? {}) as Record<string, string>;
      userAgent = headers["User-Agent"] ?? "";

      return new Response(
        JSON.stringify({
          tag_name: "v0.2.11",
          name: "v0.2.11 Release",
          html_url: "https://github.com/NISD2/open-isms/releases/tag/v0.2.11",
          published_at: "2026-10-20T13:40:00Z",
          body: "New features included. COMPOSE_REVISION: 4 required.",
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const status1 = await getUpdateStatus({ fetchFn: mockFetch });

    expect(fetchCount).toBe(1);
    expect(userAgent).toBe("open-isms");
    expect(requestedUrl).toContain("releases/latest");
    expect(status1.mode).toBe("notify");
    expect(status1.hasUpdate).toBe(true);
    expect(status1.latestVersion).toBe("0.2.11");
    expect(status1.currentVersion).toBe("0.2.10");
    expect(status1.expectedComposeRevision).toBe(4);
    expect(status1.composeUpdateRequired).toBe(true);
    expect(status1.lastCheckedAt).not.toBeNull();

    // Calling again within 24h hits cache, does NOT call fetch again
    const status2 = await getUpdateStatus({ fetchFn: mockFetch });
    expect(fetchCount).toBe(1);
    expect(status2.latestVersion).toBe("0.2.11");

    // Calling with force: true bypasses cache
    const status3 = await getUpdateStatus({ force: true, fetchFn: mockFetch });
    expect(fetchCount).toBe(2);
    expect(status3.latestVersion).toBe("0.2.11");
  });

  test("mode='notify' detects when instance is already on latest version", async () => {
    process.env.UPDATE_MODE = "notify";
    process.env.APP_VERSION = "0.2.11";
    process.env.COMPOSE_REVISION = "3";

    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          tag_name: "v0.2.11",
          name: "v0.2.11",
          html_url: "https://github.com/NISD2/open-isms/releases/tag/v0.2.11",
          published_at: "2026-10-20T13:40:00Z",
          body: "Release notes",
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const status = await getUpdateStatus({ fetchFn: mockFetch });
    expect(status.hasUpdate).toBe(false);
    expect(status.composeUpdateRequired).toBe(false);
  });

  test("handles dev version without false update alert", async () => {
    process.env.UPDATE_MODE = "notify";
    process.env.APP_VERSION = "dev";

    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          tag_name: "v0.2.11",
          name: "v0.2.11",
          html_url: "https://github.com/NISD2/open-isms/releases/tag/v0.2.11",
          published_at: "2026-10-20T13:40:00Z",
          body: null,
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const status = await getUpdateStatus({ fetchFn: mockFetch });
    expect(status.hasUpdate).toBe(false);
    expect(status.currentVersion).toBe("dev");
  });

  test("handles network errors gracefully without throwing", async () => {
    process.env.UPDATE_MODE = "notify";
    process.env.APP_VERSION = "0.2.10";

    const mockFetch = (async () => {
      throw new Error("Network unreachable");
    }) as unknown as typeof fetch;

    const status = await getUpdateStatus({ fetchFn: mockFetch });
    expect(status.hasUpdate).toBe(false);
    expect(status.error).toContain("Network unreachable");
  });
});

describe("triggerUpdater", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("fails if UPDATE_API_TOKEN is unset", async () => {
    delete process.env.UPDATE_API_TOKEN;
    const res = await triggerUpdater();
    expect(res.ok).toBe(false);
    expect(res.message).toContain("UPDATE_API_TOKEN is not configured");
  });

  test("calls updater endpoint with Bearer auth", async () => {
    process.env.UPDATE_API_TOKEN = "my-token-123";
    process.env.UPDATER_URL = "http://updater:8080/v1/update";

    let calledUrl = "";
    let authHeader = "";

    const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calledUrl = String(url);
      const headers = (init?.headers ?? {}) as Record<string, string>;
      authHeader = headers.Authorization ?? "";
      return new Response(JSON.stringify({ status: "OK" }), { status: 200 });
    }) as unknown as typeof fetch;

    const res = await triggerUpdater({ fetchFn: mockFetch });
    expect(res.ok).toBe(true);
    expect(calledUrl).toBe("http://updater:8080/v1/update");
    expect(authHeader).toBe("Bearer my-token-123");
  });

  test("treats abrupt connection termination as successful container shutdown", async () => {
    process.env.UPDATE_API_TOKEN = "my-token-123";

    const mockFetch = (async () => {
      throw new Error("fetch failed: connection reset by peer");
    }) as unknown as typeof fetch;

    const res = await triggerUpdater({ fetchFn: mockFetch });
    expect(res.ok).toBe(true);
    expect(res.message).toContain("restarting");
  });
});
