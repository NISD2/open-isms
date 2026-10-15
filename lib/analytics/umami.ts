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
/** Countries checked one by one for how many visits stayed past a single page. */
const PULSE_COUNTRIES = 8;

const point = z.object({ x: z.string(), y: z.number() });
const loginSchema = z.object({ token: z.string().min(1) });
const seriesSchema = z.object({ pageviews: z.array(point), sessions: z.array(point) });
const metricsSchema = z.array(point);
const totalsShape = {
  pageviews: z.number(),
  visits: z.number(),
  bounces: z.number(),
  totaltime: z.number(),
};
const statsSchema = z.object({
  ...totalsShape,
  comparison: z.object(totalsShape).optional(),
});

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

/** What a window of visits adds up to. A bounce is a visit that viewed a single page. */
export interface Totals {
  readonly visits: number;
  readonly bounces: number;
  readonly pageviews: number;
  /** Seconds, summed over all visits. */
  readonly totaltime: number;
}

export interface TrafficStats extends Totals {
  /** The equally long window before, as the analytics host reports it; null when it gives none. */
  readonly previous: Totals | null;
}

export interface Traffic {
  readonly stats: TrafficStats;
  readonly days: readonly TrafficDay[];
  readonly pages: readonly TrafficRow[];
  readonly referrers: readonly TrafficRow[];
}

export type TrafficResult =
  | { readonly ok: true; readonly traffic: Traffic }
  | { readonly ok: false; readonly error: string };

/** A calendar window of whole UTC days, both ends inclusive (YYYY-MM-DD). */
export interface DayWindow {
  readonly from: string;
  readonly to: string;
}

export interface WeekTraffic extends DayWindow {
  readonly visits: number;
  readonly bounces: number;
}

export interface CountryTraffic {
  /** ISO 3166-1 alpha-2, as the analytics host reports it. */
  readonly code: string;
  /** Umami's own count for the country, comparable with `CountryBefore.count`. */
  readonly count: number;
  readonly visits: number;
  readonly bounces: number;
}

/**
 * The few numbers the weekly insights need from traffic: this week against the four before it,
 * and where this week's visits came from against where the four weeks before them came from.
 */
export interface TrafficPulse {
  readonly thisWeek: WeekTraffic;
  /** Newest first, the same order the insights use for their baseline weeks. */
  readonly baselineWeeks: readonly WeekTraffic[];
  readonly countries: readonly CountryTraffic[];
  /** Umami's count per country over all baseline weeks together. */
  readonly countriesBefore: ReadonlyArray<{
    readonly code: string;
    readonly count: number;
  }>;
}

export type PulseResult =
  | { readonly ok: true; readonly pulse: TrafficPulse }
  | { readonly ok: false; readonly error: string };

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;
type Query = Readonly<Record<string, string>>;

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

const rangeQuery = (window: DayWindow): Query => ({
  startAt: String(Date.parse(`${window.from}T00:00:00Z`)),
  endAt: String(Date.parse(`${window.to}T00:00:00Z`) + DAY_MS - 1),
});

/** Logged in once; every call after that reuses the token against the one configured site. */
async function connect(config: UmamiConfig, fetchFn: Fetch) {
  const token = await login(config, fetchFn);
  const site = `${config.baseUrl}/api/websites/${config.websiteId}`;
  const get = <T>(
    what: string,
    path: string,
    schema: z.ZodType<T>,
    window: DayWindow,
    query: Query = {},
  ) =>
    fetchFn(
      `${site}/${path}?${new URLSearchParams({ ...rangeQuery(window), ...query })}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    ).then((response) => parsed(response, schema, what));
  const totals = async (window: DayWindow, query: Query = {}): Promise<Totals> => {
    const { visits, bounces, pageviews, totaltime } = await get(
      "stats",
      "stats",
      statsSchema,
      window,
      query,
    );
    return { visits, bounces, pageviews, totaltime };
  };
  const metrics = (type: string, window: DayWindow, limit: number) =>
    get(type, "metrics", metricsSchema, window, { type, limit: String(limit) });
  return { get, totals, metrics };
}

/**
 * Traffic for whole UTC days `from` to `to` inclusive, the same day boundaries the rest of the
 * Graphs tab uses. Totals, pages and referrers cover the same window.
 */
export async function loadTraffic(
  config: UmamiConfig,
  window: DayWindow,
  fetchFn: Fetch = fetch,
): Promise<TrafficResult> {
  try {
    const { get, metrics } = await connect(config, fetchFn);
    const [stats, series, pages, referrers] = await Promise.all([
      get("stats", "stats", statsSchema, window),
      get("pageviews", "pageviews", seriesSchema, window, {
        unit: "day",
        timezone: "UTC",
      }),
      metrics("path", window, TOP_ROWS),
      metrics("referrer", window, TOP_ROWS),
    ]);
    const sessionsByDay = new Map(series.sessions.map((p) => [dayOf(p.x), p.y]));
    const days = series.pageviews.map((p) => ({
      day: dayOf(p.x),
      pageviews: p.y,
      sessions: sessionsByDay.get(dayOf(p.x)) ?? 0,
    }));
    const rows = (points: readonly { x: string; y: number }[]) =>
      points.map((p) => ({ name: p.x, views: p.y }));
    const { comparison, visits, bounces, pageviews, totaltime } = stats;
    return {
      ok: true,
      traffic: {
        stats: { visits, bounces, pageviews, totaltime, previous: comparison ?? null },
        days,
        pages: rows(pages),
        referrers: rows(referrers),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "request failed",
    };
  }
}

/**
 * The weekly pulse. `weeks` is this week first, then the baseline weeks newest first, exactly as
 * the insights lay them out, so a week means the same thing here and in the rules.
 */
export async function loadPulse(
  config: UmamiConfig,
  weeks: readonly DayWindow[],
  fetchFn: Fetch = fetch,
): Promise<PulseResult> {
  try {
    const [now, ...before] = weeks;
    if (now === undefined || before.length === 0)
      throw new Error("pulse: needs a week and a baseline");
    const { totals, metrics } = await connect(config, fetchFn);
    const baselineSpan = {
      from: before.map((w) => w.from).reduce((a, b) => (a < b ? a : b)),
      to: before.map((w) => w.to).reduce((a, b) => (a > b ? a : b)),
    };
    const week = async (window: DayWindow): Promise<WeekTraffic> => {
      const { visits, bounces } = await totals(window);
      return { ...window, visits, bounces };
    };
    const [thisWeek, baselineWeeks, topNow, countriesBefore] = await Promise.all([
      week(now),
      Promise.all(before.map(week)),
      metrics("country", now, PULSE_COUNTRIES),
      metrics("country", baselineSpan, TOP_ROWS),
    ]);
    const countries = await Promise.all(
      topNow.map(async (c) => {
        const { visits, bounces } = await totals(now, { country: c.x });
        return { code: c.x, count: c.y, visits, bounces };
      }),
    );
    return {
      ok: true,
      pulse: {
        thisWeek,
        baselineWeeks,
        countries,
        countriesBefore: countriesBefore.map((c) => ({ code: c.x, count: c.y })),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "request failed",
    };
  }
}
