"use client";

import { useTranslations } from "next-intl";
import { AXES } from "@/lib/risk-assessment/axes";
import { tierBadgeStyle } from "@/lib/risk-assessment/styles";
import type { MatrixResult } from "@/lib/risk-assessment/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RadarChart } from "./RadarChart";

interface ResultCardProps {
  result: MatrixResult;
  /** When true: render as canned example (asset name + explanation copy).
   *  When false: render as the live result for the user's own answers. */
  isExample: boolean;
}

export function ResultCard({ result, isExample }: ResultCardProps) {
  const t = useTranslations("riskAssessment");

  const axisShortLabels: Record<string, string> = Object.fromEntries(
    AXES.map((axis) => [axis.id, t(`axes.${axis.id}.shortLabel`)]),
  );

  const axisOptionLabels: Record<string, string> = Object.fromEntries(
    result.axisScores.map((s) => [
      s.axisId,
      t(`axes.${s.axisId}.options.${s.optionId}.label`),
    ]),
  );

  return (
    <Card className={cn(isExample ? "bg-muted/30" : "border-primary/40")}>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2 items-start">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {isExample ? t("example.label") : t("result.heading")}
              </div>
              {isExample && (
                <div className="text-sm font-medium text-foreground">
                  {t("example.assetName")}
                </div>
              )}
            </div>
            <RadarChart
              result={result}
              axisShortLabels={axisShortLabels}
              axisOptionLabels={axisOptionLabels}
              ariaLabel={t("chart.ariaLabel")}
              title={t("chart.title")}
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("result.finalTierLabel")}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1",
                  tierBadgeStyle(result.finalTier),
                )}
              >
                {t(`tiers.${result.finalTier}.label`)}
              </Badge>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                {t("example.docsLabel")}
              </div>
              <ul className="space-y-2 text-xs">
                {result.axisScores.map((s) => (
                  <li
                    key={s.axisId}
                    className="grid grid-cols-[80px_1fr] gap-2"
                  >
                    <span className="font-medium text-foreground">
                      {t(`axes.${s.axisId}.shortLabel`)}
                    </span>
                    <span className="text-muted-foreground">
                      {t(`axes.${s.axisId}.options.${s.optionId}.label`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
