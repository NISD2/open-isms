"use client";

import { useLocale } from "next-intl";
import type { SwotQuadrant } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  strengths: SwotQuadrant;
  weaknesses: SwotQuadrant;
  opportunities: SwotQuadrant;
  threats: SwotQuadrant;
}

const cellStyle = {
  strengths: { bg: "#dcfce7", border: "#86efac", text: "#166534" },
  weaknesses: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  opportunities: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  threats: { bg: "#ffe4e6", border: "#fda4af", text: "#9f1239" },
} as const;

function SwotCell({
  quadrant,
  variant,
  isEn,
}: {
  quadrant: SwotQuadrant;
  variant: keyof typeof cellStyle;
  isEn: boolean;
}) {
  const s = cellStyle[variant];
  const items = isEn ? quadrant.itemsEn : quadrant.items;
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: s.bg, borderColor: s.border }}>
      <p className="font-semibold" style={{ color: s.text }}>
        {isEn ? quadrant.labelEn : quadrant.label}
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-zinc-700">
            <span style={{ color: s.text }}>•</span>
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SwotSection({ strengths, weaknesses, opportunities, threats }: Props) {
  const isEn = useLocale() === "en";
  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-04"
        title="SWOT-Analyse"
        titleEn="SWOT analysis"
        meta="Intern (oben) · Extern (unten)"
        metaEn="Internal (top) · External (bottom)"
      />
      <div className="rounded-xl border bg-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <SwotCell quadrant={strengths} variant="strengths" isEn={isEn} />
          <SwotCell quadrant={weaknesses} variant="weaknesses" isEn={isEn} />
          <SwotCell quadrant={opportunities} variant="opportunities" isEn={isEn} />
          <SwotCell quadrant={threats} variant="threats" isEn={isEn} />
        </div>
        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? "Biggest risk: dependency on the consulting-partner programme (73 % of Year-2 revenue). Mitigation runs through REF-12 (sensitivity by driver) and §8.11 (worst-case contingency plan). Today's traction (152 users, 73 CEO course starts) is concrete, the competitive landscape is open, the market is large and unoccupied in the SME segment. Source: §7."
            : "Größtes Risiko: Abhängigkeit vom Beratungspartner-Programm (73 % des Jahr-2-Umsatzes). Mitigation läuft über REF-12 (Sensitivität nach Treiber) und §8.11 (Worst-Case-Notfall-Plan). Die heutige Traktion (152 Nutzer, 73 CEO-Kurs-Starts) ist konkret, die Wettbewerbslage ist offen, der Markt ist groß und un-besetzt im KMU-Segment. Quelle: §7."}
        </p>
      </div>
    </section>
  );
}
