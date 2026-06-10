"use client";

import { useLocale } from "next-intl";
import type { RevenueChannel } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  channels: RevenueChannel[];
}

export function BusinessModelSection({ channels }: Props) {
  const isEn = useLocale() === "en";
  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-01"
        title="Geschäftsmodell-Fluss"
        titleEn="Business Model Flow"
        meta="Open-Source-Kern + 5 Erlöswege"
        metaEn="Open-source core + 5 revenue channels"
      />
      <div className="rounded-xl border bg-card p-8">
        <div className="grid grid-cols-[280px_64px_1fr] items-center gap-4">
          <div className="rounded-xl bg-[#1e40af] p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-wide text-blue-200">
              {isEn ? "Open-source core" : "Open-Source-Kern"}
            </p>
            <p className="mt-2 text-2xl font-bold leading-tight">nisd2.eu</p>
            <p className="mt-3 text-sm leading-relaxed text-blue-100">
              {isEn
                ? "AGPL-3.0 · free forever · no lock-in"
                : "AGPL-3.0 · dauerhaft kostenfrei · kein Lock-in"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            {channels.map((_, idx) => (
              <div
                key={idx}
                className="h-px w-12 bg-zinc-300"
                style={{ transform: `translateY(${(idx - 2) * 6}px)` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {channels.map((c) => (
              <div
                key={c.id}
                className={`flex items-start gap-3 rounded-lg border bg-background p-3 ${
                  c.isDashed
                    ? "border-dashed border-zinc-300 text-muted-foreground"
                    : "border-zinc-200"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-medium ${
                    c.isDashed
                      ? "bg-zinc-100 text-zinc-500"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {c.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{isEn ? c.labelEn : c.label}</p>
                  <p className="mt-1 text-xs leading-tight text-muted-foreground">
                    {isEn ? c.sublabelEn : c.sublabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "Solid lines = main path in the financial plan (consulting referral dominates with 73 % of Year-2 revenue, see REF-05). Dashed lines = selective or uncertain side paths, deliberately not priced in (own implementation is primarily referred to consulting partners; grants project-dependent). Source: §2.6."
            : "Durchgezogene Linien = Hauptpfad im Finanzplan (Beratungs-Vermittlung dominiert mit 73 % Jahr-2-Umsatz, siehe REF-05). Gestrichelte Linien = selektive bzw. unsichere Nebenpfade, bewusst nicht eingepreist (eigene Implementierung wird primär an Beratungspartner vermittelt; Förderungen projektabhängig). Quelle: §2.6."}
        </p>
      </div>
    </section>
  );
}
