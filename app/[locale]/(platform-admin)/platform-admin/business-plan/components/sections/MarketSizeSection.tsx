"use client";

import { useLocale } from "next-intl";
import type { MarketLayer } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  layers: MarketLayer[];
}

const styleByKey: Record<MarketLayer["key"], { bg: string; border: string; text: string }> = {
  tam: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e3a8a" },
  sam: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  som: { bg: "#bfdbfe", border: "#3b82f6", text: "#1e40af" },
};

const widthByKey: Record<MarketLayer["key"], string> = {
  tam: "100%",
  sam: "70%",
  som: "40%",
};

export function MarketSizeSection({ layers }: Props) {
  const isEn = useLocale() === "en";
  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-02"
        title="TAM / SAM / SOM"
        meta="Marktgrößen-Pyramide"
        metaEn="Market-size pyramid"
      />
      <div className="rounded-xl border bg-card p-8">
        <div className="space-y-2">
          {layers.map((layer) => {
            const style = styleByKey[layer.key];
            return (
              <div key={layer.key} className="flex justify-center">
                <div
                  className="rounded-xl border px-6 py-4"
                  style={{
                    width: widthByKey[layer.key],
                    backgroundColor: style.bg,
                    borderColor: style.border,
                  }}
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-mono text-xs font-bold uppercase tracking-wider"
                      style={{ color: style.text }}
                    >
                      {layer.key}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: style.text }}
                    >
                      {isEn ? layer.labelEn : layer.label}
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold" style={{ color: style.text }}>
                    {isEn ? layer.rangeEn : layer.range}
                  </p>
                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                    {isEn ? layer.sourceEn : layer.source}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "The platform is sector-agnostic and EU-wide replicable; SOM is the paying SME base in Year 3 (Mar 2028 – Feb 2029) via consulting partners, not the platform user base. Platform use stays free forever; the commercial lever sits in referrals to consulting partners. Sources: ENISA, BSI sector FAQs, NIS2 Recital 12, §4.1."
            : "Die Plattform ist sektor-agnostisch und EU-weit replizierbar; SOM ist die zahlende KMU-Basis Jahr 3 (Mär 2028 – Feb 2029) über Beratungspartner, nicht die Plattform-Nutzerbasis. Plattform-Nutzung bleibt dauerhaft kostenfrei; der wirtschaftliche Hebel liegt in der Vermittlung an Beratungspartner. Quellen: ENISA, BSI Sektor-FAQs, NIS2 Erw.Gr. 12, §4.1."}
        </p>
      </div>
    </section>
  );
}
