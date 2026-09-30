"use client";

import { useTranslations } from "next-intl";
import { SIZE_THRESHOLDS } from "@/lib/applicability/size-thresholds";

/** The two size limits of § 28 BSIG, read from the classifier's own constants. */
export function SizeThresholds() {
  const t = useTranslations("durchgang.ui.thresholds");
  const rows = [
    { key: "important", limit: SIZE_THRESHOLDS.medium, scope: t("annex") },
    { key: "essential", limit: SIZE_THRESHOLDS.large, scope: t("annex1") },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map(({ key, limit, scope }) => (
        <div key={key} className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold">{t(key)}</p>
          <p className="text-xs text-muted-foreground">{scope}</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight">
            {t("employees", { count: limit.employees })}
          </p>
          <p className="mt-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t("or")}
          </p>
          <p className="mt-1 text-sm leading-6">
            {t("money", { turnover: limit.turnover, balanceSheet: limit.balanceSheet })}
          </p>
        </div>
      ))}
    </div>
  );
}
