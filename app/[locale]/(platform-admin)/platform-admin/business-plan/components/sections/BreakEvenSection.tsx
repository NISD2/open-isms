"use client";

import { useLocale } from "next-intl";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BreakEvenPoint } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  points: BreakEvenPoint[];
}

export function BreakEvenSection({ points }: Props) {
  const isEn = useLocale() === "en";
  const locale = isEn ? "en-US" : "de-DE";
  const revenueLabel = isEn ? "Revenue cumulative" : "Umsatz kumuliert";
  const expenseLabel = isEn ? "Expenses cumulative" : "Ausgaben kumuliert";
  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-06"
        title="Break-Even (kumuliert)"
        titleEn="Break-even (cumulative)"
        meta="Quartalsende · Quelle: Abschnitte 8.2 + 8.8"
        metaEn="Quarter end · Source: Sections 8.2 + 8.8"
      />
      <div className="rounded-xl border bg-card p-6">
        <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 24, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#f4f4f5" vertical={false} />
            <XAxis
              dataKey="quarter"
              stroke="#d4d4d8"
              tick={{ fill: "#52525b", fontSize: 13 }}
            />
            <YAxis
              stroke="#d4d4d8"
              tick={{ fill: "#52525b", fontSize: 13 }}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              label={{
                value: "EUR",
                angle: -90,
                position: "insideLeft",
                fill: "#52525b",
                fontSize: 13,
              }}
            />
            <Tooltip
              labelFormatter={(label) =>
                isEn ? `Quarter end ${label}` : `Quartalsende ${label}`
              }
              formatter={(value, name) => [
                `${(value as number).toLocaleString(locale)} EUR`,
                name,
              ]}
            />
            <Legend
              verticalAlign="top"
              align="left"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 12, fontSize: 14, color: "#52525b" }}
            />
            <Bar
              dataKey="revenueCumulative"
              fill="#3b82f6"
              fillOpacity={0.85}
              name={revenueLabel}
              radius={[6, 6, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="expenseCumulative"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              name={expenseLabel}
            />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
        <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "Monthly break-even in May 2027 (month 15), cumulative break-even in October 2027, within the 24-month IHK viability window. Transitional reserve need around €14,600, comfortably within the declared €10-25k range. The founder grant inflow is not included in the UG revenue line; see §8.9."
            : "Monatlicher Break-Even Mai 2027 (Monat 15), kumulierter Break-Even Oktober 2027 - innerhalb des 24-Monats-IHK-Tragfähigkeits-Fensters. Übergangs-Rücklagenbedarf rund €14.600, komfortabel innerhalb der deklarierten Spanne €10-25k. Gründungszuschuss-Zufluss ist nicht in der UG-Umsatz-Linie enthalten; siehe §8.9."}
        </p>
      </div>
    </section>
  );
}
