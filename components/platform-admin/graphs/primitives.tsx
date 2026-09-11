"use client";

/**
 * The pieces every card on the Graphs tab is built from.
 *
 * Two rules hold across all of them. Values are always printed as text, never
 * only as a length or a shade, so nothing on the tab is readable by colour
 * alone. And every card carries a table view, because three of the four light
 * mode series colours sit under 3:1 against a white card.
 */

import { Table2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { type Bar as BarDatum, percent } from "./derive";
import { heatColor, heatInk } from "./palette";

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------

export interface TableSpec {
  columns: string[];
  rows: Array<Array<string | number>>;
}

export function ChartCard({
  title,
  subtitle,
  note,
  table,
  children,
}: {
  title: string;
  subtitle?: string;
  /** What the number means or what it leaves out. Sits under the chart. */
  note?: string;
  table: TableSpec;
  children: ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setView(view === "chart" ? "table" : "chart")}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-pressed={view === "table"}
        >
          <Table2 className="h-3.5 w-3.5" />
          {view === "chart" ? "Table" : "Chart"}
        </button>
      </CardHeader>
      <CardContent>
        {view === "chart" ? children : <DataTable table={table} />}
        {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

function DataTable({ table }: { table: TableSpec }) {
  return (
    <div className="max-h-[320px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b text-left text-muted-foreground">
            {table.columns.map((column, i) => (
              <th
                key={column}
                className={`pb-2 pr-4 font-medium ${i === 0 ? "" : "text-right"}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-border/50 last:border-0">
              {table.columns.map((column, i) => (
                <td
                  key={column}
                  className={`py-1.5 pr-4 ${
                    i === 0 ? "" : "text-right tabular-nums text-muted-foreground"
                  }`}
                >
                  {row[i]}
                </td>
              ))}
            </tr>
          ))}
          {table.rows.length === 0 && (
            <tr>
              <td
                colSpan={table.columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                Nothing in this range
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat tiles
// ---------------------------------------------------------------------------

export function StatTile({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  /** Signed change against the previous window of the same length. */
  delta?: { amount: number; period: string };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {delta && (
          <p
            className={`text-xs ${
              delta.amount > 0
                ? "text-[#006300] dark:text-[#0ca30c]"
                : delta.amount < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {delta.amount > 0 ? "+" : ""}
            {delta.amount} vs {delta.period}
          </p>
        )}
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bars — funnels, distributions, histograms
// ---------------------------------------------------------------------------

/**
 * One series, one colour. Where a single band is the one worth looking at
 * (the size band we sell to), that band keeps the accent and the rest go
 * neutral, rather than every bar getting a hue of its own.
 */
export function CategoryBars({
  bars,
  accent = "var(--viz-1)",
}: {
  bars: BarDatum[];
  accent?: string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const emphasised = bars.some((b) => b.emphasis);

  return (
    <div className="space-y-2.5">
      {bars.map((bar) => (
        <div
          key={bar.label}
          className="grid grid-cols-[minmax(8rem,16rem)_1fr_3.5rem] items-center gap-3 rounded-sm py-0.5 transition-colors hover:bg-muted/50"
        >
          <div className="min-w-0">
            <p className="truncate text-sm" title={bar.label}>
              {bar.label}
            </p>
            {/* The hint wraps rather than truncates: it carries the
                conversion rate or the caveat, which is the half of the row
                a reader cannot reconstruct from the bar. */}
            {bar.hint && <p className="text-xs text-muted-foreground">{bar.hint}</p>}
          </div>
          <div
            className="h-2.5 w-full rounded-r-[4px]"
            style={{ background: "var(--viz-track)" }}
          >
            <div
              className="h-2.5 rounded-r-[4px]"
              style={{
                width: `${Math.max(bar.value > 0 ? 1.5 : 0, (bar.value / max) * 100)}%`,
                background: emphasised && !bar.emphasis ? "var(--viz-muted)" : accent,
              }}
            />
          </div>
          <span className="text-right text-sm tabular-nums">
            {bar.value.toLocaleString("en-GB")}
          </span>
        </div>
      ))}
      {bars.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing in this range
        </p>
      )}
    </div>
  );
}

export function barsTable(bars: BarDatum[], categoryHeading: string): TableSpec {
  const total = bars.reduce((sum, b) => sum + b.value, 0);
  return {
    columns: [categoryHeading, "Count", "Share"],
    rows: bars.map((b) => [b.label, b.value, percent(b.value, total)]),
  };
}

// ---------------------------------------------------------------------------
// Time series
// ---------------------------------------------------------------------------

export interface SeriesSpec {
  key: string;
  label: string;
  color: string;
}

export type TrendRow = { bucket: string; label: string; title: string } & Record<
  string,
  string | number
>;

function configOf(series: SeriesSpec[]): ChartConfig {
  return Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  );
}

/**
 * An all-zero window gets a sentence instead of an empty plot. A blank pair of
 * axes reads as "this broke"; the sentence says "nothing happened", which is
 * a finding rather than a failure.
 */
function hasValues(data: TrendRow[], series: SeriesSpec[]): boolean {
  return data.some((row) =>
    series.some((s) => {
      const value = row[s.key];
      return typeof value === "number" && value > 0;
    }),
  );
}

function NothingHere() {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
      Nothing recorded in this range
    </div>
  );
}

/**
 * What recharts hands a tooltip element. Written out rather than imported
 * because recharts types `content` as a bare ReactElement, so an element whose
 * own props are all optional is the only shape that type-checks here.
 */
interface TooltipItem {
  dataKey?: string | number;
  value?: string | number;
  payload?: { title?: string };
}

/**
 * One tooltip, every series at that x. The value leads and the series name
 * follows it, because by the time someone is hovering they already know which
 * line they are on and want the number. Series identity rides a short stroke
 * in the series colour, never coloured text.
 */
function TrendTooltip({
  active,
  payload,
  series,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipItem>;
  series: SeriesSpec[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const title = payload[0]?.payload?.title ?? "";

  return (
    <div className="grid min-w-[9rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      {title && <p className="font-medium">{title}</p>}
      {series.map((s) => {
        const item = payload.find((p) => p.dataKey === s.key);
        if (item === undefined) return null;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="font-semibold tabular-nums">{item.value ?? 0}</span>
            <span className="truncate text-muted-foreground">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function TrendLines({ data, series }: { data: TrendRow[]; series: SeriesSpec[] }) {
  if (!hasValues(data, series)) return <NothingHere />;
  return (
    <ChartContainer config={configOf(series)} className="aspect-auto h-[240px] w-full">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={false}
          tickMargin={4}
        />
        <ChartTooltip content={<TrendTooltip series={series} />} />
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

export function TrendColumns({
  data,
  series,
  stacked = true,
}: {
  data: TrendRow[];
  series: SeriesSpec[];
  /** Stack when the parts add up to a meaningful whole; group when they do not. */
  stacked?: boolean;
}) {
  if (!hasValues(data, series)) return <NothingHere />;
  return (
    <ChartContainer config={configOf(series)} className="aspect-auto h-[240px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={false}
          tickMargin={4}
        />
        <ChartTooltip content={<TrendTooltip series={series} />} />
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId={stacked ? "a" : undefined}
            fill={`var(--color-${s.key})`}
            maxBarSize={24}
            // The gap between touching marks is the card colour showing
            // through, not a border drawn round each segment.
            stroke="var(--color-card)"
            strokeWidth={stacked && series.length > 1 ? 2 : 0}
            radius={!stacked || i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

export function trendTable(
  data: TrendRow[],
  series: SeriesSpec[],
  periodHeading: string,
): TableSpec {
  return {
    columns: [periodHeading, ...series.map((s) => s.label)],
    rows: data.map((row) => [
      row.title,
      ...series.map((s) => {
        const value = row[s.key];
        return typeof value === "number" ? value : 0;
      }),
    ]),
  };
}

// ---------------------------------------------------------------------------
// Cohort heatmap
// ---------------------------------------------------------------------------

/** Month-offset columns, keyed by their heading so no key is an array index. */
function offsetColumns(
  rows: Array<{ retained: Array<number | null> }>,
): Array<{ heading: string; offset: number }> {
  const width = rows[0]?.retained.length ?? 0;
  return Array.from({ length: width }, (_, offset) => ({
    heading: offset === 0 ? "Month 0" : `+${offset}`,
    offset,
  }));
}

export function CohortHeatmap({
  rows,
  monthLabel,
}: {
  rows: Array<{ cohort: string; size: number; retained: Array<number | null> }>;
  monthLabel: (cohort: string) => string;
}) {
  const columns = offsetColumns(rows);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No cohorts in this range
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Not w-full: the offset columns are fixed width, so stretching the
          table would dump all the slack into the cohort-name column and push
          the grid off to the right. */}
      <table className="min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Signed up</th>
            <th className="pb-2 pr-4 text-right font-medium">People</th>
            {columns.map((column) => (
              <th
                key={column.heading}
                className="w-16 px-1 pb-2 text-center font-medium tabular-nums"
              >
                {column.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.cohort}>
              <td className="py-1 pr-4 whitespace-nowrap">{monthLabel(row.cohort)}</td>
              <td className="py-1 pr-4 text-right tabular-nums text-muted-foreground">
                {row.size}
              </td>
              {columns.map((column) => {
                const count = row.retained[column.offset] ?? null;
                const fraction = count === null || row.size === 0 ? 0 : count / row.size;
                return (
                  <td key={column.heading} className="w-16 p-0.5">
                    {count === null ? (
                      <div className="h-8 rounded-sm border border-dashed border-border/60" />
                    ) : (
                      <div
                        className={`flex h-8 items-center justify-center rounded-sm text-xs tabular-nums ${heatInk(fraction)}`}
                        style={{ background: heatColor(fraction) }}
                        title={`${count} of ${row.size} active (${percent(count, row.size)})`}
                      >
                        {count === 0 ? "" : `${Math.round(fraction * 100)}%`}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function cohortTable(
  rows: Array<{ cohort: string; size: number; retained: Array<number | null> }>,
  monthLabel: (cohort: string) => string,
): TableSpec {
  const columns = offsetColumns(rows);
  return {
    columns: ["Signed up", "People", ...columns.map((c) => c.heading)],
    rows: rows.map((row) => [
      monthLabel(row.cohort),
      row.size,
      ...columns.map((c) => row.retained[c.offset] ?? "—"),
    ]),
  };
}
