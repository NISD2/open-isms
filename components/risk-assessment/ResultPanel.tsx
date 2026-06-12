"use client";

import { useTranslations } from "next-intl";
import { AXES } from "@/lib/risk-assessment/axes";
import {
  ART21_MEASURES,
  bausteineForTier,
} from "@/lib/risk-assessment/recommendations";
import { domainStyle, tierBadgeStyle } from "@/lib/risk-assessment/styles";
import type { MatrixResult } from "@/lib/risk-assessment/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RadarChart } from "./RadarChart";

interface ResultPanelProps {
  result: MatrixResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const t = useTranslations("riskAssessment");

  const finalTier = result.finalTier;
  const drivingDomain = result.drivingDomain;
  const bausteine = bausteineForTier(finalTier);

  // Per-axis short labels for the radar chart. Each axis has its own
  // shortLabel in the i18n bundle so all 7 spikes are distinguishable.
  const axisShortLabels: Record<string, string> = Object.fromEntries(
    AXES.map((axis) => [axis.id, t(`axes.${axis.id}.shortLabel`)]),
  );

  // Hard-stop notes: surface the rule that fired so the user sees what drove
  // a domain minimum tier. The note key lives on the axis (axes.ts) so adding
  // or removing a hard-stop in the future is a single edit.
  const hardStopNotes: string[] = [];
  result.axisScores.forEach((axisScore) => {
    const axis = AXES.find((a) => a.id === axisScore.axisId);
    if (axis?.hardStop && axisScore.score === axis.hardStop.triggerScore) {
      hardStopNotes.push(t(`hardStops.${axis.hardStop.noteKey}`));
    }
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>{t("result.heading")}</span>
            <Badge
              variant="outline"
              className={cn("text-base px-3 py-1", tierBadgeStyle(finalTier))}
            >
              {t(`tiers.${finalTier}.label`)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t.rich("result.drivingDomainBody", {
              domain: () => (
                <span className="font-medium text-foreground">
                  {t(`domains.${drivingDomain}.label`)}
                </span>
              ),
            })}
          </p>
          <p className="text-sm">{t(`tiers.${finalTier}.description`)}</p>
          {hardStopNotes.length > 0 && (
            <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
              {hardStopNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("result.domainBreakdownHeading")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {result.domains.map((d) => (
            <div
              key={d.domain}
              className={cn(
                "rounded-md border p-3 space-y-1",
                domainStyle(d.domain, "badge"),
              )}
            >
              <div className="text-xs uppercase tracking-wide font-medium">
                {t(`domains.${d.domain}.shortLabel`)}
              </div>
              <div className="text-lg font-semibold">
                {t(`tiers.${d.tier}.shortLabel`)}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("result.domainScoreLabel")}: {d.sum}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("result.visualizationHeading")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadarChart
            result={result}
            axisShortLabels={axisShortLabels}
            ariaLabel={t("chart.ariaLabel")}
            title={t("chart.title")}
          />
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
              {t("domains.security.shortLabel")}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
              {t("domains.operational.shortLabel")}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
              {t("domains.compliance.shortLabel")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("result.whyHeading")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("result.whySubtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {result.axisScores.map((axisScore) => (
            <div key={axisScore.axisId} className="space-y-1">
              <div className="font-medium">
                {t(`axes.${axisScore.axisId}.question`)}
              </div>
              <div className="text-muted-foreground italic">
                {t(`axes.${axisScore.axisId}.options.${axisScore.optionId}.label`)}
              </div>
              <p>{t(`axes.${axisScore.axisId}.options.${axisScore.optionId}.why`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("result.bausteineHeading")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("result.bausteineSubtitle")}
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {bausteine.map((b) => (
            <Badge key={b} variant="outline" className="font-mono text-xs">
              {b}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("result.measuresHeading")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("result.measuresSubtitle")}
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {ART21_MEASURES.map((m) => (
            <div key={m} className="flex gap-2">
              <Badge variant="outline" className="font-mono text-xs shrink-0">
                {m}
              </Badge>
              <span>{t(`art21Measures.${m}`)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("result.signoffHeading")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{t("result.signoffBody")}</p>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">{t("disclaimer.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p>{t("disclaimer.body")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
