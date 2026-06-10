"use client";

import { useLocale } from "next-intl";
import type { FunnelStage } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  stages: FunnelStage[];
}

const bandStyle: Record<
  FunnelStage["band"],
  { bg: string; border: string; text: string; widthPct: number }
> = {
  reach: { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a", widthPct: 100 },
  platform: { bg: "#bae6fd", border: "#0ea5e9", text: "#0c4a6e", widthPct: 80 },
  training: { bg: "#fef3c7", border: "#f59e0b", text: "#78350f", widthPct: 62 },
  pipeline: { bg: "#fed7aa", border: "#ea580c", text: "#7c2d12", widthPct: 46 },
  revenue: { bg: "#dcfce7", border: "#10b981", text: "#065f46", widthPct: 34 },
};

export function RevenueFunnelSection({ stages }: Props) {
  const isEn = useLocale() === "en";
  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-11"
        title="Reichweite zu Umsatz"
        titleEn="Reach to revenue"
        meta="Wie aus 40.500 Impressionen 400 zahlende KMU werden"
        metaEn="How 40,500 impressions become 400 paying SMEs"
      />
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col items-center gap-2">
          {stages.map((stage, idx) => {
            const style = bandStyle[stage.band];
            const isLast = idx === stages.length - 1;
            return (
              <div key={stage.id} className="w-full flex flex-col items-center gap-2">
                <div
                  className="rounded-xl border px-6 py-4 transition-shadow"
                  style={{
                    width: `${style.widthPct}%`,
                    backgroundColor: style.bg,
                    borderColor: style.border,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: style.text }}
                    >
                      {isEn ? stage.labelEn : stage.label}
                    </span>
                    <span
                      className="font-mono text-base font-bold tabular-nums"
                      style={{ color: style.text }}
                    >
                      {isEn ? stage.valueEn : stage.value}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: style.text, opacity: 0.85 }}
                  >
                    {isEn ? stage.noteEn : stage.note}
                  </p>
                </div>
                {!isLast && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "Today's reach (top) to platform activation to consulting pipeline to projected Year-3 revenue (bottom). Conversion from sign-up to consulting referral is the lever: a single referral per month in Year 1 already carries the financial plan. Sources: REF-08 (reach), §8.2 (Year-3 revenue)."
            : "Heutige Reichweite (oben) → Plattform-Aktivierung → Beratungs-Pipeline → projizierte Jahr-3-Umsätze (unten). Die Konversion von Anmeldung zu Beratungs-Vermittlung ist der Hebel: schon eine Vermittlung pro Monat in Jahr 1 trägt sich finanziell. Quellen: REF-08 (Reichweite), §8.2 (Jahr-3-Umsatz)."}
        </p>
      </div>
    </section>
  );
}
