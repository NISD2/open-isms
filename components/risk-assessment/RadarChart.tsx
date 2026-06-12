"use client";

import { AXES } from "@/lib/risk-assessment/axes";
import { domainStyle } from "@/lib/risk-assessment/styles";
import type { Domain, MatrixResult, Score } from "@/lib/risk-assessment/types";
import { cn } from "@/lib/utils";

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = SIZE / 2 - 50;
const MAX_SCORE = 3;
const LABEL_RADIUS = MAX_RADIUS + 24;

interface AxisGeometry {
  angle: number;
  tipX: number;
  tipY: number;
  labelX: number;
  labelY: number;
  domain: Domain;
}

function buildAxisGeometry(): AxisGeometry[] {
  return AXES.map((axis, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / AXES.length;
    return {
      angle,
      tipX: CX + MAX_RADIUS * Math.cos(angle),
      tipY: CY + MAX_RADIUS * Math.sin(angle),
      labelX: CX + LABEL_RADIUS * Math.cos(angle),
      labelY: CY + LABEL_RADIUS * Math.sin(angle),
      domain: axis.domain,
    };
  });
}

function pointForScore(angle: number, score: Score): { x: number; y: number } {
  const r = (score / MAX_SCORE) * MAX_RADIUS;
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

function ringPath(scoreLevel: number, geometry: AxisGeometry[]): string {
  const points = geometry.map((g) => {
    const r = (scoreLevel / MAX_SCORE) * MAX_RADIUS;
    return `${CX + r * Math.cos(g.angle)},${CY + r * Math.sin(g.angle)}`;
  });
  return `M ${points[0]} L ${points.slice(1).join(" L ")} Z`;
}

interface RadarChartProps {
  result: MatrixResult;
  axisShortLabels: Record<string, string>;
}

export function RadarChart({ result, axisShortLabels }: RadarChartProps) {
  const geometry = buildAxisGeometry();

  // Group user points by domain so each domain renders as its own polygon.
  // This lets the viewer see at a glance which domain "spikes" outward.
  const pointsByDomain: Record<Domain, Array<{ x: number; y: number; angle: number }>> = {
    security: [],
    operational: [],
    compliance: [],
  };

  result.axisScores.forEach((axisScore, i) => {
    const g = geometry[i];
    if (!g) return;
    const pt = pointForScore(g.angle, axisScore.score);
    pointsByDomain[g.domain].push({ ...pt, angle: g.angle });
  });

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-md"
        role="img"
        aria-label="Risk assessment radar chart"
      >
        <title>Risikobewertung visualisiert nach Domäne</title>

        {/* Grid rings at score levels 1, 2, 3 */}
        {[1, 2, 3].map((level) => (
          <path
            key={`ring-${level}`}
            d={ringPath(level, geometry)}
            fill="none"
            className="stroke-muted-foreground/20"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines from center to tip */}
        {geometry.map((g, i) => (
          <line
            key={`axis-${i}`}
            x1={CX}
            y1={CY}
            x2={g.tipX}
            y2={g.tipY}
            className={cn("stroke-muted-foreground/30", domainStyle(g.domain, "radarDot"))}
            strokeWidth={0.5}
          />
        ))}

        {/* Per-domain user shape: each domain a small polygon back through center */}
        {(["security", "operational", "compliance"] as Domain[]).map((domain) => {
          const points = pointsByDomain[domain];
          if (points.length === 0) return null;
          const path = [
            `M ${CX},${CY}`,
            ...points.map((p) => `L ${p.x},${p.y}`),
            `Z`,
          ].join(" ");
          return (
            <path
              key={`shape-${domain}`}
              d={path}
              className={domainStyle(domain, "radarFill")}
              strokeWidth={1.5}
              fillRule="evenodd"
            />
          );
        })}

        {/* Score dots on each axis at the user's selection */}
        {result.axisScores.map((axisScore, i) => {
          const g = geometry[i];
          if (!g) return null;
          const pt = pointForScore(g.angle, axisScore.score);
          return (
            <circle
              key={`dot-${axisScore.axisId}`}
              cx={pt.x}
              cy={pt.y}
              r={4}
              className={domainStyle(g.domain, "radarDot")}
            />
          );
        })}

        {/* Axis labels at the tips */}
        {geometry.map((g, i) => {
          const axis = AXES[i];
          if (!axis) return null;
          const label = axisShortLabels[axis.id] ?? axis.id;
          const textAnchor =
            Math.abs(g.labelX - CX) < 8
              ? "middle"
              : g.labelX > CX
                ? "start"
                : "end";
          return (
            <text
              key={`label-${axis.id}`}
              x={g.labelX}
              y={g.labelY}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="fill-foreground text-[11px]"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
