"use client";

import { useTranslations } from "next-intl";
import {
  REPORT_TEXT,
  REPORTING_CLOCK,
  REPORTS,
  type Report,
} from "@/lib/compliance/bsig-32";
import type { WalkLocale } from "@/lib/durchgang";

/** The § 32 Abs. 1 BSIG reporting deadlines, as a timeline read from lib/compliance/bsig-32. */
export function ReportingClock({ locale }: { locale: WalkLocale }) {
  const t = useTranslations("durchgang.ui.clock");
  const when: Readonly<Record<Report, { value: string; from: string }>> = {
    early_warning: {
      value: t("hours", { count: REPORTING_CLOCK.earlyWarningHours }),
      from: t("fromKnowledge"),
    },
    notification: {
      value: t("hours", { count: REPORTING_CLOCK.notificationHours }),
      from: t("fromKnowledge"),
    },
    final_report: {
      value: t("months", { count: REPORTING_CLOCK.finalReportMonths }),
      from: t("fromNotification"),
    },
  };

  return (
    <ol className="relative grid gap-4 sm:grid-cols-3">
      {REPORTS.map((report, i) => (
        <li key={report} className="relative rounded-2xl border bg-card p-5 shadow-sm">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
            {i + 1}
          </span>
          <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">
            {when[report].value}
          </p>
          <p className="text-xs text-muted-foreground">{when[report].from}</p>
          <p className="mt-3 font-semibold">{REPORT_TEXT[locale][report].name}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {REPORT_TEXT[locale][report].content}
          </p>
        </li>
      ))}
    </ol>
  );
}
