"use client";

/**
 * Traffic: the part of the funnel above the signup, read from the analytics host.
 *
 * Separate from the growth fetch on purpose. Growth is all-time and folded on the client; traffic
 * lives on another server, is bounded by the selected range, and must be allowed to fail (or be
 * switched off, the default for a self-hosted instance) without taking the other cards with it.
 */

import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { type Bar, pageConversion } from "./derive";
import { VIZ } from "./palette";
import {
  barsTable,
  CategoryBars,
  ChartCard,
  type SeriesSpec,
  StatTile,
  TrendColumns,
  trendTable,
} from "./primitives";
import { bucketSeries, type Granularity } from "./range";
import { duration, percentChange, trafficTiles } from "./traffic-tiles";

const TOP_PAGES = 12;
const TOP_REFERRERS = 9;

const SESSIONS: SeriesSpec[] = [{ key: "sessions", label: "Sessions", color: VIZ.slot1 }];

function Notice({ tone, children }: { tone: "muted" | "error"; children: string }) {
  return (
    <p
      className={`rounded-lg border p-4 text-sm ${
        tone === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {children}
    </p>
  );
}

const referrerBars = (rows: ReadonlyArray<{ name: string; views: number }>): Bar[] => {
  const total = rows.reduce((sum, r) => sum + r.views, 0);
  return rows.slice(0, TOP_REFERRERS).map((r) => ({
    label: r.name,
    value: r.views,
    hint: total === 0 ? undefined : `${Math.round((r.views / total) * 100)}%`,
  }));
};

export function TrafficCards({
  from,
  to,
  days,
  granularity,
  period,
  signups,
  compare,
}: {
  from: string;
  to: string;
  days: string[];
  granularity: Granularity;
  period: string;
  /** Signups per page in the same range, from the platform's own records. */
  signups: ReadonlyMap<string, number>;
  /** Show the change against the previous period. Off for all time, which has no earlier window. */
  compare: boolean;
}) {
  const query = trpc.platformAdmin.traffic.useQuery(
    { from, to },
    { refetchOnWindowFocus: false, staleTime: 5 * 60_000 },
  );

  const traffic = query.data?.configured && query.data.ok ? query.data.traffic : null;

  const sessions = useMemo(() => {
    if (traffic === null) return [];
    const byDay = new Map(traffic.days.map((d) => [d.day, d.sessions]));
    return bucketSeries(
      days,
      granularity,
      (day) => ({ sessions: byDay.get(day) ?? 0 }),
      "sum",
    );
  }, [traffic, days, granularity]);

  const pages = useMemo(
    () => (traffic === null ? [] : pageConversion(traffic.pages, signups, TOP_PAGES)),
    [traffic, signups],
  );

  const tiles = useMemo(
    () => (traffic === null ? null : trafficTiles(traffic.stats)),
    [traffic],
  );

  if (query.isPending) return <Notice tone="muted">Reading traffic...</Notice>;
  if (query.isError) {
    return (
      <Notice tone="error">{`Could not read traffic: ${query.error.message}`}</Notice>
    );
  }
  const result = query.data;
  if (!result.configured) {
    return (
      <Notice tone="muted">
        Traffic is off. Set ANALYTICS_SCRIPT_URL, ANALYTICS_WEBSITE_ID,
        ANALYTICS_API_USERNAME and ANALYTICS_API_PASSWORD (a view-only login on your
        Umami) to see visits here.
      </Notice>
    );
  }
  if (!result.ok)
    return <Notice tone="error">{`Could not read traffic: ${result.error}`}</Notice>;

  const pageBars: Bar[] = pages.map((p) => ({
    label: p.page,
    value: p.views,
    hint: `${p.signups} ${p.signups === 1 ? "signup" : "signups"}`,
  }));

  const before = compare ? (tiles?.previous ?? null) : null;
  const change = (now: number | null, then: number | null | undefined) => {
    const amount = before === null ? null : percentChange(now, then ?? null);
    return amount === null
      ? undefined
      : { amount, period: "the previous period", unit: "%" };
  };

  return (
    <div className="space-y-4">
      {tiles && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Engaged visits"
            value={tiles.now.engaged}
            delta={change(tiles.now.engaged, before?.engaged)}
            sub="viewed more than one page"
          />
          <StatTile
            label="All visits"
            value={tiles.now.visits}
            delta={change(tiles.now.visits, before?.visits)}
            sub={
              tiles.now.singlePageShare === null
                ? undefined
                : `${Math.round(tiles.now.singlePageShare * 100)}% left after one page`
            }
          />
          <StatTile
            label="Pages per visit"
            value={
              tiles.now.pagesPerVisit === null
                ? "no data"
                : tiles.now.pagesPerVisit.toFixed(1)
            }
            delta={change(tiles.now.pagesPerVisit, before?.pagesPerVisit)}
          />
          <StatTile
            label="Time per visit"
            value={
              tiles.now.secondsPerVisit === null
                ? "no data"
                : duration(tiles.now.secondsPerVisit)
            }
            delta={change(tiles.now.secondsPerVisit, before?.secondsPerVisit)}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={`Sessions per ${period.toLowerCase()}`}
          subtitle="Distinct visits to the public site, as the analytics host counts them"
          note="Counts every visit, whatever it did, where the Engaged visits tile above counts only those that went past one page. A lower bound too: visitors with a tracker blocker are missing, and pages whose address is a credential are never sent. Counted per day, so a returning visitor is counted once for each day."
          table={trendTable(sessions, SESSIONS, period)}
        >
          <TrendColumns data={sessions} series={SESSIONS} />
        </ChartCard>

        <ChartCard
          title="Most viewed pages, and what they brought in"
          subtitle="Page views in range; the second line is signups that registered from that page"
          note="Locales are merged. A page with many views and no signups informs without converting; a page with signups and few views is worth linking to harder. Signups are only recorded from registrations made after this was added."
          table={{
            columns: ["Page", "Views", "Signups", "Signups per 1,000 views"],
            rows: pages.map((p) => [
              p.page,
              p.views,
              p.signups,
              p.per1000 === null ? "no views" : p.per1000.toFixed(1),
            ]),
          }}
        >
          <CategoryBars bars={pageBars} />
        </ChartCard>

        <ChartCard
          title="Where visitors came from"
          subtitle="Page views in range, by referring site"
          note="Direct visits and visits without a referrer are not listed."
          table={barsTable(referrerBars(traffic?.referrers ?? []), "Referrer")}
        >
          <CategoryBars bars={referrerBars(traffic?.referrers ?? [])} />
        </ChartCard>
      </div>
    </div>
  );
}
