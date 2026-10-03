"use client";

import { RiskMatrix } from "@/components/durchgang/RiskMatrix";
import type { WalkLocale } from "@/lib/durchgang";
import { cellKey } from "@/lib/export/risk-cells";

/**
 * The walk's risk matrix with the company's risks counted per cell (`riskCounts`), for a server
 * page: the counts arrive as data, since a function cannot cross from the server.
 */
export function RiskCounts({
  locale,
  counts,
}: {
  locale: WalkLocale;
  counts: Readonly<Record<string, number>>;
}) {
  return (
    <RiskMatrix
      locale={locale}
      counts={(frequency, impact) => counts[cellKey(frequency, impact)] ?? 0}
    />
  );
}
