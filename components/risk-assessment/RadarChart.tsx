"use client";

import * as Recharts from "recharts";
import { AXES } from "@/lib/risk-assessment/axes";
import type { MatrixResult, Tier } from "@/lib/risk-assessment/types";

const TIER_COLOR: Record<Tier, string> = {
  basis: "#10b981",
  standard: "#f59e0b",
  kern: "#ef4444",
};

interface RadarChartProps {
  result: MatrixResult;
  axisShortLabels: Record<string, string>;
  /** Per-axis selected option label, keyed by axisId. Used for the hover
   *  tooltip so users see *what answer* drove a given spike. */
  axisOptionLabels: Record<string, string>;
  ariaLabel: string;
  title: string;
}

interface DataPoint {
  subject: string;
  score: number;
  optionLabel: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md max-w-xs">
      <div className="font-semibold text-foreground">{d.subject}</div>
      <div className="text-muted-foreground mt-1">{d.optionLabel}</div>
      <div className="text-foreground mt-1 font-mono">
        Score {d.score}/3
      </div>
    </div>
  );
}

export function RadarChart({
  result,
  axisShortLabels,
  axisOptionLabels,
  ariaLabel,
  title,
}: RadarChartProps) {
  const data: DataPoint[] = AXES.map((axis) => {
    const axisScore = result.axisScores.find((s) => s.axisId === axis.id);
    return {
      subject: axisShortLabels[axis.id] ?? axis.id,
      score: axisScore?.score ?? 0,
      optionLabel: axisOptionLabels[axis.id] ?? "",
    };
  });

  const color = TIER_COLOR[result.finalTier];

  return (
    <div className="w-full" role="img" aria-label={ariaLabel} title={title}>
      <Recharts.ResponsiveContainer width="100%" height={460}>
        <Recharts.RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <Recharts.PolarGrid
            stroke="currentColor"
            className="text-muted-foreground/30"
          />
          <Recharts.PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 13, fill: "currentColor" }}
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
            dot={{ r: 5, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 7, fill: color, strokeWidth: 2, stroke: "#fff" }}
          />
          <Recharts.Tooltip
            content={<CustomTooltip />}
            cursor={false}
          />
        </Recharts.RadarChart>
      </Recharts.ResponsiveContainer>
    </div>
  );
}
