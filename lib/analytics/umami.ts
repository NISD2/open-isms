/**
 * Read-only client for the Umami instance behind the analytics tag: the numbers the Graphs tab
 * shows above the signup funnel. Self-hosted Umami logs in with a username and password and hands
 * back a bearer token; there is no API key.
 *
 * Every response is checked against a schema before use, and a failure comes back as data
 * (`{ ok: false }`), so the card can say what went wrong and the rest of the tab is unaffected.
 */
import { z } from "zod";
import type { UmamiConfig } from "./umami-config";

const TIMEOUT_MS = 8_000;
const DAY_MS = 86_400_000;
const TOP_ROWS = 50;

const point = z.object({ x: z.string(), y: z.number() });
const loginSchema = z.object({ token: z.string().min(1) });
const seriesSchema = z.object({ pageviews: z.array(point), sessions: z.array(point) });
const metricsSchema = z.array(point);

export interface TrafficDay {
  /** UTC calendar day, YYYY-MM-DD. */
  readonly day: string;
  /** Distinct sessions that day. Umami's own notion: a hash of address, browser and site. */
  readonly sessions: number;
  readonly pageviews: number;
}

export interface TrafficRow {
  readonly name: string;
  readonly views: number;
}

export interface Traffic {
  readonly days: readonly TrafficDay[];
  readonly pages: readonly TrafficRow[];
  readonly referrers: readonly TrafficRow[];
}

export type TrafficResult =
  | { readonly ok: true; readonly traffic: Traffic }
  | { readonly ok: false; readonly error: string };

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

const parsed = async <T>(
  response: Response,
  schema: z.ZodType<T>,
  what: string,
): Promise<T> => {
  if (!response.ok) throw new Error(`${what}: HTTP ${response.status}`);
  const body: unknown = await response.json().catch(() => undefined);
  const result = schema.safeParse(body);
  if (!result.success) throw new Error(`${what}: unexpected response`);
  return result.data;
};

const login = async (config: UmamiConfig, fetchFn: Fetch): Promise<string> => {
  const response = await fetchFn(`${config.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: config.username, password: config.password }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return (await parsed(response, loginSchema, "login")).token;
};

const dayOf = (umamiTimestamp: string): string => umamiTimestamp.slice(0, 10);

/**
 * Traffic for whole UTC days `from` to `to` inclusive (YYYY-MM-DD), the same day boundaries the
 * rest of the Graphs tab uses. Pages and referrers are totals over the same window.
 */
export async function loadTraffic(
  config: UmamiConfig,
  window: { readonly from: string; readonly to: string },
  fetchFn: Fetch = fetch,
): Promise<TrafficResult> {
  try {
    const token = await login(config, fetchFn);
    const startAt = Date.parse(`${window.from}T00:00:00Z`);
    const endAt = Date.parse(`${window.to}T00:00:00Z`) + DAY_MS - 1;
    const site = `${config.baseUrl}/api/websites/${config.websiteId}`;
    const get = (path: string, query: Record<string, string>) =>
      fetchFn(
        `${site}/${path}?${new URLSearchParams({ startAt: String(startAt), endAt: String(endAt), ...query })}`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
    const [series, pages, referrers] = await Promise.all([
      get("pageviews", { unit: "day", timezone: "UTC" }).then((r) =>
        parsed(r, seriesSchema, "pageviews"),
      ),
      get("metrics", { type: "path", limit: String(TOP_ROWS) }).then((r) =>
        parsed(r, metricsSchema, "pages"),
      ),
      get("metrics", { type: "referrer", limit: String(TOP_ROWS) }).then((r) =>
        parsed(r, metricsSchema, "referrers"),
      ),
    ]);
    const sessionsByDay = new Map(series.sessions.map((p) => [dayOf(p.x), p.y]));
    const days = series.pageviews.map((p) => ({
      day: dayOf(p.x),
      pageviews: p.y,
      sessions: sessionsByDay.get(dayOf(p.x)) ?? 0,
    }));
    const rows = (points: readonly { x: string; y: number }[]) =>
      points.map((p) => ({ name: p.x, views: p.y }));
    return {
      ok: true,
      traffic: { days, pages: rows(pages), referrers: rows(referrers) },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "request failed",
    };
  }
}
