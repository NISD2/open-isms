"use client";

import { useLocale } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { RevenueSlice } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  year: string;
  total: number;
  slices: RevenueSlice[];
}

interface TooltipPayload {
  payload: { name: string; value: number };
}

export function RevenueMixSection({ year, total, slices }: Props) {
  const isEn = useLocale() === "en";
  const locale = isEn ? "en-US" : "de-DE";
  const yearLabel = isEn ? "Year 2 (Mar 2027 - Feb 2028)" : year;
  const totalLabel = isEn ? "Total" : "Gesamt";
  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-05"
        title="Umsatz-Mix Jahr 2"
        titleEn="Revenue mix Year 2"
        meta={`${totalLabel} ${total.toLocaleString(locale)} EUR · ${yearLabel}`}
        metaEn={`${totalLabel} ${total.toLocaleString(locale)} EUR · ${yearLabel}`}
      />
      <div className="rounded-xl border bg-card p-6">
        <div className="grid grid-cols-[1fr_1.4fr] items-center gap-8">
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey={isEn ? "nameEn" : "name"}
                  innerRadius={70}
                  outerRadius={140}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={3}
                  label={({ percent }: { percent?: number }) =>
                    percent ? `${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                  fontSize={14}
                  fontWeight={600}
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const p = (payload[0] as unknown as TooltipPayload).payload;
                    return (
                      <div className="rounded-lg border bg-card p-3 shadow-sm">
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.value.toLocaleString(locale)} EUR (
                          {((p.value / total) * 100).toFixed(0)}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-3">
            {slices.map((s) => (
              <li key={s.name} className="flex items-baseline gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{isEn ? s.nameEn : s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.value.toLocaleString(locale)} EUR ·{" "}
                    {((s.value / total) * 100).toFixed(0)}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "Consulting referral is the dominant lever in Year 2 (73 %); REF-12 shows the sensitivity of this pillar by driver. Licenses + Hosted-Cloud are the second revenue line and contribute 16 % from Year 2 onward. Partner-training affiliates (SoSafe, Advisera, contracts in preparation) are the smallest revenue stream and focus founder time on referral rather than in-house build. Source: §8.1."
            : "Die Beratungs-Vermittlung ist der dominante Hebel im Jahr 2 (73 %); REF-12 zeigt die Sensitivität dieser Säule nach Treiber. Lizenzen + Hosted-Cloud sind die zweite Erlös-Linie und tragen ab Jahr 2 16 %. Partner-Schulungs-Affiliates (SoSafe, Advisera, Verträge in Anbahnung) sind die kleinste Erlös-Strömung und fokussieren Founder- Zeit auf Vermittlung statt Eigenbau. Quelle: §8.1."}
        </p>
      </div>
    </section>
  );
}
