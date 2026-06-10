"use client";

import { useLocale } from "next-intl";
import type { CostAlternative } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  alternatives: CostAlternative[];
}

const fmt = (eur: number) =>
  eur === 0 ? "€0" : eur >= 1000 ? `€${(eur / 1000).toFixed(eur >= 10000 ? 0 : 1)}k` : `€${eur}`;

export function CostComparisonSection({ alternatives }: Props) {
  const isEn = useLocale() === "en";
  const globalMax = Math.max(...alternatives.map((a) => a.maxEur));

  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-09"
        title="Kostenvergleich NIS2-Compliance"
        titleEn="NIS2-compliance cost comparison"
        meta="Jahr 1, KMU-Sicht"
        metaEn="Year 1, SME view"
      />
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-4">
          {alternatives.map((alt) => {
            const minPct = (alt.minEur / globalMax) * 100;
            const maxPct = (alt.maxEur / globalMax) * 100;
            const widthPct = Math.max(maxPct - minPct, alt.minEur === 0 && alt.maxEur === 0 ? 0 : 1);
            const accent = alt.isUs ? "#10b981" : "#94a3b8";
            const accentBg = alt.isUs ? "#dcfce7" : "#e2e8f0";
            return (
              <div key={alt.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: alt.isUs ? "#065f46" : "#0f172a" }}
                    >
                      {isEn ? alt.nameEn : alt.name}
                    </span>
                    {alt.isUs && (
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#065f46", backgroundColor: "#dcfce7" }}
                      >
                        {isEn ? "Our model" : "Unser Modell"}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {fmt(alt.minEur)} – {fmt(alt.maxEur)}
                  </span>
                </div>
                <div className="relative h-6 rounded-md bg-muted">
                  <div
                    className="absolute h-full rounded-md"
                    style={{
                      left: `${minPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: accentBg,
                      borderColor: accent,
                      borderWidth: 1,
                      borderStyle: "solid",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{isEn ? alt.unitEn : alt.unit}.</span>{" "}
                  {isEn ? alt.noteEn : alt.note}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "Sources: business plan §4.3. Consulting rates match typical Sopra Steria / KPMG / Capgemini project pricing. Vanta range from enterprise-sales reports. DataGuard pricing is not public, estimated from market signals. nisd2.eu column: platform free forever (AGPL-3.0), optional paid training tickets."
            : "Quellen: Geschäftsplan §4.3. Beratungssätze entsprechen typischer Sopra Steria / KPMG / Capgemini-Projektpreise. Vanta-Spanne aus Enterprise-Sales-Berichten. DataGuard-Preise nicht öffentlich, geschätzt aus Marktsignalen. nisd2.eu-Spalte: Plattform dauerhaft kostenfrei (AGPL-3.0), optional bezahlte Schulungs-Tickets."}
        </p>
      </div>
    </section>
  );
}
