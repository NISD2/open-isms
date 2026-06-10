"use client";

import { useLocale } from "next-intl";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { Competitor } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  competitors: Competitor[];
}

interface PointPayload {
  payload: Competitor & { x: number; y: number; z: number };
}

const PRICE_TICKS = [
  { x: 0, label: "€0" },
  { x: 0.25, label: "€10k" },
  { x: 0.5, label: "€25k" },
  { x: 0.75, label: "€60k" },
  { x: 1, label: "€100k+" },
];

const LOCKIN_TICKS_DE = [
  { y: 0, label: "Kein Vertrag" },
  { y: 0.5, label: "Jahresvertrag" },
  { y: 1, label: "3-Jahre + Export-Friktion" },
];

const LOCKIN_TICKS_EN = [
  { y: 0, label: "No contract" },
  { y: 0.5, label: "Annual contract" },
  { y: 1, label: "3-year + export friction" },
];

function headcountColor(headcount: number, isUs: boolean | undefined) {
  if (isUs) return { fill: "#3b82f6", stroke: "#1e40af" };
  const clamped = Math.min(Math.max(headcount, 1), 800);
  const t = Math.log10(clamped) / Math.log10(800);
  const r = Math.round(160 + (220 - 160) * t);
  const g = Math.round(180 - 80 * t);
  const b = Math.round(180 - 130 * t);
  const fill = `rgb(${r}, ${g}, ${b})`;
  const stroke = `rgb(${Math.max(r - 40, 110)}, ${Math.max(g - 60, 40)}, ${Math.max(b - 60, 40)})`;
  return { fill, stroke };
}

export function CompetitorMatrixSection({ competitors }: Props) {
  const isEn = useLocale() === "en";
  const lockinTicks = isEn ? LOCKIN_TICKS_EN : LOCKIN_TICKS_DE;
  const data = competitors.map((c) => ({
    ...c,
    x: c.priceX,
    y: c.lockinY,
    z: c.headcount,
  }));

  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-03"
        title="Wettbewerber-Positionierung"
        titleEn="Competitor positioning"
        meta="Preis × Lock-in · Blasen-Größe = Team-Headcount"
        metaEn="Price × Lock-in · Bubble size = team headcount"
      />
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-muted-foreground">
            {isEn ? "Team headcount (color):" : "Team-Headcount (Farbe):"}
          </span>
          {[
            { label: "1–10", swatch: headcountColor(5, false).fill },
            { label: "20–100", swatch: headcountColor(50, false).fill },
            { label: "100–800", swatch: headcountColor(400, false).fill },
            { label: "nisd2.eu", swatch: "#3b82f6" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.swatch }}
              />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="h-[440px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 24, right: 40, bottom: 50, left: 80 }}>
              <CartesianGrid stroke="#f4f4f5" />
              <XAxis
                dataKey="x"
                type="number"
                domain={[0, 1]}
                ticks={PRICE_TICKS.map((t) => t.x)}
                tickFormatter={(v: number) =>
                  PRICE_TICKS.find((t) => t.x === v)?.label ?? ""
                }
                stroke="#d4d4d8"
                tick={{ fill: "#52525b", fontSize: 12 }}
                label={{
                  value: isEn ? "Annual price (license)" : "Jahres-Preis (Lizenz)",
                  position: "bottom",
                  offset: 26,
                  fill: "#52525b",
                  fontSize: 13,
                }}
              />
              <YAxis
                dataKey="y"
                type="number"
                domain={[0, 1]}
                ticks={lockinTicks.map((t) => t.y)}
                tickFormatter={(v: number) =>
                  lockinTicks.find((t) => t.y === v)?.label ?? ""
                }
                stroke="#d4d4d8"
                tick={{ fill: "#52525b", fontSize: 12 }}
                label={{
                  value: isEn ? "Lock-in profile" : "Lock-in-Profil",
                  angle: -90,
                  position: "insideLeft",
                  offset: -10,
                  fill: "#52525b",
                  fontSize: 13,
                }}
              />
              <ZAxis dataKey="z" type="number" range={[120, 1500]} domain={[1, 1000]} />
              <ReferenceLine x={0.5} stroke="#e4e4e7" strokeDasharray="3 3" />
              <ReferenceLine y={0.5} stroke="#e4e4e7" strokeDasharray="3 3" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const p = (payload[0] as PointPayload).payload;
                  return (
                    <div className="max-w-xs rounded-lg border bg-card p-3 shadow-sm">
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="mt-1 text-xs">
                        <span className="font-medium">{isEn ? "Price:" : "Preis:"}</span>{" "}
                        <span className="text-muted-foreground">{p.priceLabel}</span>
                      </p>
                      <p className="text-xs">
                        <span className="font-medium">{isEn ? "Lock-in:" : "Lock-in:"}</span>{" "}
                        <span className="text-muted-foreground">
                          {isEn ? p.lockinLabelEn : p.lockinLabel}
                        </span>
                      </p>
                      <p className="text-xs">
                        <span className="font-medium">{isEn ? "Team:" : "Team:"}</span>{" "}
                        <span className="text-muted-foreground">
                          {p.headcount}{" "}
                          {isEn
                            ? p.headcount === 1
                              ? "person"
                              : "people"
                            : p.headcount === 1
                              ? "Person"
                              : "Personen"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        {isEn ? p.noteEn : p.note}
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter data={data} shape="circle">
                {data.map((c) => {
                  const color = headcountColor(c.headcount, c.isUs);
                  return (
                    <Cell
                      key={c.id}
                      fill={color.fill}
                      stroke={color.stroke}
                      fillOpacity={c.isUs ? 1 : 0.75}
                      strokeWidth={c.isUs ? 2 : 1}
                    />
                  );
                })}
              </Scatter>
              {data.map((c) => (
                <text
                  key={`label-${c.id}`}
                  x={`${(c.x * 100).toFixed(0)}%`}
                  y={`${(100 - c.y * 100).toFixed(0)}%`}
                  dx={c.isUs ? 18 : 14}
                  dy={4}
                  fontSize={13}
                  fontWeight={c.isUs ? 700 : 500}
                  fill={c.isUs ? "#1e40af" : "#27272a"}
                >
                  {c.name}
                </text>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "Three categories on one chart, not one homogeneous group. Enterprise OSS GRC (CISO Assistant, verinice): structurally interesting but different ICP (technical compliance teams, federal authorities, KRITIS operators). Commercial NIS2 SME SaaS (NIS2Compass, DataGuard, Secfix, Conformio): the direct ICP-match band. Workshop / consulting (Ratisbona, Sopra/KPMG-tier projects): different category of buy. Bubble size = team headcount (log scale), color shifts toward red with team size: Vanta ≈ 800 people, nisd2.eu two. The only true direct ICP competitor is NIS2Compass; the differentiator runs through open source and no lock-in, not through price. Source: §4.2."
            : "Drei Kategorien auf einer Matrix, keine homogene Gruppe. Enterprise-OSS-GRC (CISO Assistant, verinice): strukturell verwandt, aber ICP-fremd (technische Compliance-Teams, Behörden, KRITIS-Betreiber). Kommerzielle NIS2-SME-SaaS (NIS2Compass, DataGuard, Secfix, Conformio): direkter ICP-Match-Band. Workshop/Beratung (Ratisbona, Sopra/KPMG-Tier-Projekte): andere Kauf-Kategorie. Blasen-Größe = Team-Headcount (logarithmisch), Färbung verschiebt sich mit Teamgröße in Richtung Rot: Vanta ≈ 800 Personen, nisd2.eu zwei. Der einzige echte direkte ICP-Wettbewerber ist NIS2Compass; die Differenzierung läuft über Open Source und kein Lock-in, nicht über Preis. Quelle: §4.2."}
        </p>
      </div>
    </section>
  );
}
