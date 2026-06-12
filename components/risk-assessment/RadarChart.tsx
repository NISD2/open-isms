"use client";

import * as Recharts from "recharts";
import { AXES } from "@/lib/risk-assessment/axes";
import type { MatrixResult, Tier } from "@/lib/risk-assessment/types";

// Tier color palette - matches the tier badge palette in styles.ts so the
// radar fill, the tier badge, and the domain-breakdown card all agree.
// Hex codes used directly because recharts takes strings for stroke/fill.
const TIER_COLOR: Record<Tier, string> = {
  basis: "#10b981", // emerald-500
  standard: "#f59e0b", // amber-500
  kern: "#ef4444", // red-500
};

interface RadarChartProps {
  result: MatrixResult;
  axisShortLabels: Record<string, string>;
  /** Screen-reader label and SVG tooltip - both i18n strings from the caller. */
  ariaLabel: string;
  title: string;
}

export function RadarChart({
  result,
  axisShortLabels,
  ariaLabel,
  title,
}: RadarChartProps) {
  // One row per axis. Score 0-3 is the raw value; the PolarRadiusAxis domain
  // below sets the floor at -1 so score 0 lands on the innermost ring instead
  // of collapsing to the center.
  const data = AXES.map((axis) => {
    const axisScore = result.axisScores.find((s) => s.axisId === axis.id);
    return {
      subject: axisShortLabels[axis.id] ?? axis.id,
      score: axisScore?.score ?? 0,
    };
  });

  const color = TIER_COLOR[result.finalTier];

  return (
    <div
      className="w-full"
      role="img"
      aria-label={ariaLabel}
      title={title}
    >
      <Recharts.ResponsiveContainer width="100%" height={320}>
        <Recharts.RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <Recharts.PolarGrid
            stroke="currentColor"
            className="text-muted-foreground/30"
          />
          <Recharts.PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-foreground"
          />
          <Recharts.PolarRadiusAxis
            domain={[-1, 3]}
            tickCount={5}
            tick={false}
            axisLine={false}
          />
          <Recharts.Radar
            name="score"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </Recharts.RadarChart>
      </Recharts.ResponsiveContainer>
    </div>
  );
}
