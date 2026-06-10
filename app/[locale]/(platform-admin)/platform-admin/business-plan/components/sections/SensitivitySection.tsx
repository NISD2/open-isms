"use client";

import { useLocale } from "next-intl";
import type { SensitivityDriver } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  planBaseline: number;
  planNote: string;
  planNoteEn: string;
  drivers: SensitivityDriver[];
}

const fmtEur = (v: number) =>
  v >= 1000 ? `€${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `€${v}`;

export function SensitivitySection({ planBaseline, planNote, planNoteEn, drivers }: Props) {
  const isEn = useLocale() === "en";
  const allValues = drivers.flatMap((d) => [d.lowValue, d.planValue, d.highValue]);
  const globalMax = Math.max(...allValues, planBaseline);
  const planPct = (planBaseline / globalMax) * 100;

  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-12"
        title="Sensitivität nach Treiber (Jahr 2, Vermittlungs-Erlös)"
        titleEn="Sensitivity by driver (Year 2, referral revenue)"
        meta="Ein Treiber bewegt sich, zwei bleiben am Plan"
        metaEn="One driver moves, two stay at plan"
      />
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              {isEn ? "Plan baseline (§8.2)" : "Plan-Baseline (§8.2)"}
            </span>
            <span className="font-mono text-base font-bold tabular-nums text-blue-900">
              {fmtEur(planBaseline)}{isEn ? " / year" : " / Jahr"}
            </span>
          </div>
          <p className="mt-1 text-xs text-blue-900/80">{isEn ? planNoteEn : planNote}</p>
        </div>

        <div className="space-y-5">
          {drivers.map((d) => {
            const lowPct = (d.lowValue / globalMax) * 100;
            const highPct = (d.highValue / globalMax) * 100;
            return (
              <div key={d.driver} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {isEn ? d.driverEn : d.driver}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {isEn ? d.unitEn : d.unit}
                  </span>
                </div>

                <div className="relative h-9 rounded-md bg-muted">
                  <div
                    className="absolute h-full rounded-l-md"
                    style={{
                      left: 0,
                      width: `${lowPct}%`,
                      backgroundColor: "#fee2e2",
                      borderColor: "#ef4444",
                      borderWidth: 1,
                      borderStyle: "solid",
                    }}
                  />
                  <div
                    className="absolute h-full rounded-md"
                    style={{
                      left: `${lowPct}%`,
                      width: `${highPct - lowPct}%`,
                      backgroundColor: "#dcfce7",
                      borderTop: "1px solid #10b981",
                      borderBottom: "1px solid #10b981",
                      borderRight: "1px solid #10b981",
                    }}
                  />
                  <div
                    className="absolute h-full w-[2px]"
                    style={{ left: `${planPct}%`, backgroundColor: "#1e3a8a" }}
                    title={isEn ? "Plan baseline" : "Plan-Baseline"}
                  />
                  <div
                    className="absolute -top-1 h-2 w-2 rounded-full"
                    style={{
                      left: `calc(${planPct}% - 4px)`,
                      backgroundColor: "#1e3a8a",
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-900">
                      Low: {isEn ? d.lowLabelEn : d.lowLabel}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-red-900">
                      {fmtEur(d.lowValue)}
                    </p>
                  </div>
                  <div className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-900">
                      Plan: {isEn ? d.planLabelEn : d.planLabel}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-blue-900">
                      {fmtEur(d.planValue)}
                    </p>
                  </div>
                  <div className="rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-green-900">
                      High: {isEn ? d.highLabelEn : d.highLabel}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-green-900">
                      {fmtEur(d.highValue)}
                    </p>
                  </div>
                </div>

                <p className="text-xs italic text-muted-foreground">
                  {isEn ? d.rationaleEn : d.rationale}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "Reading: each driver moves independently while the other two stay at plan. This isolates how strongly each driver shifts revenue. The dominant lever is the number of consulting partners (1 to 6 shifts annual referral revenue from €18k to €108k, a factor of 6). Even in the low-low-low case (1 partner, 0.5 referrals, €800 commission = €4,800/year) the contingency plan from Chapter 7 carries; see §8.11."
            : "Lesart: jeder Treiber wird unabhängig bewegt, die anderen zwei bleiben am Plan. Damit isoliert das Diagramm, welcher Treiber den Umsatz wie stark verschiebt. Der dominante Hebel ist die Anzahl Beratungspartner (1 → 6 verschiebt den Jahres-Vermittlungs-Umsatz von €18k auf €108k, Faktor 6). Selbst im Low-Low-Low-Fall (1 Partner, 0,5 Vermittlungen, €800 Provision = €4.800/Jahr) trägt der Notfall-Plan aus Kapitel 7; siehe §8.11."}
        </p>
      </div>
    </section>
  );
}
