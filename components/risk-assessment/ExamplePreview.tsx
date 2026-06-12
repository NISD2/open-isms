"use client";

import { useTranslations } from "next-intl";
import { AXES } from "@/lib/risk-assessment/axes";
import { tierBadgeStyle } from "@/lib/risk-assessment/styles";
import type { MatrixResult } from "@/lib/risk-assessment/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RadarChart } from "./RadarChart";

interface ExamplePreviewProps {
  result: MatrixResult;
}

export function ExamplePreview({ result }: ExamplePreviewProps) {
  const t = useTranslations("riskAssessment");

  const axisShortLabels: Record<string, string> = Object.fromEntries(
    AXES.map((axis) => [axis.id, t(`axes.${axis.id}.shortLabel`)]),
  );

  return (
    <Card className="mb-8 bg-muted/30">
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2 items-start">
          <div className="space-y-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("example.label")}
              </div>
              <div className="text-base font-medium">
                {t("example.assetName")}
              </div>
            </div>
            <RadarChart
              result={result}
              axisShortLabels={axisShortLabels}
              ariaLabel={t("chart.ariaLabel")}
              title={t("chart.title")}
            />
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                {t("example.tierLabel")}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1",
                  tierBadgeStyle(result.finalTier),
                )}
              >
                {t(`tiers.${result.finalTier}.label`)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {t("example.tierExplanation")}
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                {t("example.docsLabel")}
              </div>
              <ul className="space-y-1.5 text-xs">
                {result.axisScores.slice(0, 4).map((s) => (
                  <li key={s.axisId} className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t(`axes.${s.axisId}.shortLabel`)}:
                    </span>{" "}
                    {t(`axes.${s.axisId}.options.${s.optionId}.label`)}
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
