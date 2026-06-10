"use client";

import { useLocale } from "next-intl";
import type { AuditFinding } from "@/lib/business-plan/data";
import { SectionHeader } from "./SectionHeader";

interface Props {
  findings: AuditFinding[];
}

type CoverageStyle = {
  label: string;
  labelEn: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
};

const coverageStyle: Record<AuditFinding["coverage"], CoverageStyle> = {
  direct: {
    label: "Plattform-Modul",
    labelEn: "Platform module",
    bg: "#dcfce7",
    border: "#10b981",
    text: "#065f46",
    dot: "#10b981",
  },
  evidence: {
    label: "Evidenz-Upload",
    labelEn: "Evidence upload",
    bg: "#fef3c7",
    border: "#f59e0b",
    text: "#92400e",
    dot: "#f59e0b",
  },
  external: {
    label: "Extern erforderlich",
    labelEn: "External required",
    bg: "#fee2e2",
    border: "#ef4444",
    text: "#991b1b",
    dot: "#ef4444",
  },
};

export function AuditCoverageSection({ findings }: Props) {
  const isEn = useLocale() === "en";
  const directCount = findings.filter((f) => f.coverage === "direct").length;
  const evidenceCount = findings.filter((f) => f.coverage === "evidence").length;
  const externalCount = findings.filter((f) => f.coverage === "external").length;

  return (
    <section className="space-y-3 max-w-5xl">
      <SectionHeader
        ref="REF-10"
        title="Top-10 NIS2-Audit-Befunde, Plattform-Abdeckung"
        titleEn="Top-10 NIS2 audit findings, platform coverage"
        meta="Marc Laneve, ISO 27001 Lead Auditor (März 2026)"
        metaEn="Marc Laneve, ISO 27001 Lead Auditor (March 2026)"
      />
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
          {(["direct", "evidence", "external"] as const).map((k) => {
            const style = coverageStyle[k];
            const count =
              k === "direct" ? directCount : k === "evidence" ? evidenceCount : externalCount;
            return (
              <div key={k} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: style.bg, borderColor: style.border, borderWidth: 1, borderStyle: "solid" }}
                />
                <span className="font-medium" style={{ color: style.text }}>
                  {isEn ? style.labelEn : style.label} ({count}/10)
                </span>
              </div>
            );
          })}
        </div>
        <div className="space-y-1.5">
          {findings.map((f) => {
            const style = coverageStyle[f.coverage];
            return (
              <div
                key={f.rank}
                className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 rounded-md px-3 py-2"
                style={{ backgroundColor: style.bg + "55" }}
              >
                <span
                  className="font-mono text-xs font-bold tabular-nums"
                  style={{ color: style.text }}
                >
                  #{f.rank}
                </span>
                <span className="text-sm" style={{ color: "#0f172a" }}>
                  {isEn ? f.findingEn : f.finding}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: style.bg,
                    borderColor: style.border,
                    borderWidth: 1,
                    borderStyle: "solid",
                    color: style.text,
                  }}
                >
                  {isEn ? style.labelEn : style.label}
                </span>
                <span className="font-mono text-xs tabular-nums" style={{ color: style.text }}>
                  {f.module}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
          {isEn
            ? `Result: ${directCount} of 10 findings are addressed directly by platform modules, ${evidenceCount} via evidence upload (screenshots, configuration exports). The platform covers all ten most frequent audit findings. Source: §4.2.5 of the business plan.`
            : `Ergebnis: ${directCount} von 10 Befunden werden direkt durch Plattform-Module adressiert, ${evidenceCount} durch Evidenz-Upload (Screenshots, Konfigurations-Exporte). Damit deckt die Plattform alle zehn häufigsten Audit-Befunde ab. Quelle: §4.2.5 des Geschäftsplans.`}
        </p>
      </div>
    </section>
  );
}
