"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ObligationsTableProps = {
  penaltyCeiling: { amount: string; turnoverPercent: string };
  supervision: "proactive" | "reactive" | null;
};

export function ObligationsTable({
  penaltyCeiling,
  supervision,
}: ObligationsTableProps) {
  const t = useTranslations("applicability.result");

  const rows = [
    {
      label: t("penalty"),
      value: t("penaltyValue", {
        amount: penaltyCeiling.amount,
        percent: penaltyCeiling.turnoverPercent,
      }),
      info: t("penaltyInfo"),
    },
    {
      label: t("supervisionLabel"),
      value:
        supervision === "proactive"
          ? t("supervisionProactive")
          : t("supervisionReactive"),
      info: t("supervisionInfo"),
    },
    {
      label: t("registration"),
      value: t("registrationDeadline"),
      info: t("registrationInfo"),
    },
    {
      label: t("riskManagement"),
      value: t("riskManagementValue"),
      info: t("riskManagementInfo"),
    },
    {
      label: t("incidentReporting"),
      value: t("incidentReportingValue"),
      info: t("incidentReportingInfo"),
    },
    {
      label: t("managementLiability"),
      value: t("managementLiabilityValue"),
      info: t("managementLiabilityInfo"),
    },
    {
      label: t("managementTraining"),
      value: t("managementTrainingValue"),
      info: t("managementTrainingInfo"),
    },
  ];

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">{t("obligations")}</h3>
      <div className="rounded-lg border divide-y text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0 px-3 py-2.5"
          >
            <div className="font-medium text-xs sm:w-[180px] shrink-0">
              {row.label}
            </div>
            <div className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
              <span className="flex-1">{row.value}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  {row.info}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
