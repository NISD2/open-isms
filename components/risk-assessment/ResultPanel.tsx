"use client";

import { useTranslations } from "next-intl";
import { AXES } from "@/lib/risk-assessment/axes";
import {
  art21MeasuresForTier,
  bauspeineForTier,
} from "@/lib/risk-assessment/scoring";
import type { Domain, MatrixResult, Tier } from "@/lib/risk-assessment/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RadarChart } from "./RadarChart";

const TIER_BADGE_STYLES: Record<Tier, string> = {
  basis: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  standard: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  kern: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

const DOMAIN_BADGE_STYLES: Record<Domain, string> = {
  security: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  operational: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  compliance: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
};

interface ResultPanelProps {
  result: MatrixResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const t = useTranslations("riskAssessment");

  const finalTier = result.finalTier;
  const drivingDomain = result.drivingDomain;
  const bausteine = bauspeineForTier(finalTier);
  const measures = art21MeasuresForTier(finalTier);

  const axisShortLabels: Record<string, string> = {};
  AXES.forEach((axis) => {
    axisShortLabels[axis.id] = t(`axes.${axis.id}.question`);
  });

  // Hard-stop notes: surface the rule that fired, so the user sees what drove
  // a domain minimum tier (transparency requirement from the design doc).
  const hardStopNotes: string[] = [];
  result.axisScores.forEach((axisScore) => {
    const axis = AXES.find((a) => a.id === axisScore.axisId);
    if (axis?.hardStop && axisScore.score === axis.hardStop.triggerScore) {
      const noteKey = axis.id === "internetExposure"
        ? "internetExposed"
        : axis.id === "vendorSupport"
          ? "vendorAbandoned"
          : axis.id === "downtimeTolerance"
            ? "downtimeMinutes"
            : axis.id === "replaceability"
              ? "irreplaceable"
              : axis.id === "personalData"
                ? "sensitivePii"
                : null;
      if (noteKey) {
        hardStopNotes.push(t(`hardStops.${noteKey}`));
      }
    }
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>{t("result.heading")}</span>
            <Badge variant="outline" className={cn("text-base px-3 py-1", TIER_BADGE_STYLES[finalTier])}>
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
          <p className="text-sm">
            {t(`tiers.${finalTier}.description`)}
          </p>
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
          <CardTitle className="text-base">{t("result.domainBreakdownHeading")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {result.domains.map((d) => (
            <div
              key={d.domain}
              className={cn(
                "rounded-md border p-3 space-y-1",
                DOMAIN_BADGE_STYLES[d.domain],
              )}
            >
              <div className="text-xs uppercase tracking-wide font-medium">
                {t(`domains.${d.domain}.shortLabel`)}
              </div>
              <div className="text-lg font-semibold">{t(`tiers.${d.tier}.shortLabel`)}</div>
              <div className="text-xs text-muted-foreground">
                {t("result.domainScoreLabel")}: {d.sum}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("result.heading")} - Visualisierung</CardTitle>
        </CardHeader>
        <CardContent>
          <RadarChart
            result={result}
            axisShortLabels={Object.fromEntries(
              AXES.map((axis) => [axis.id, t(`domains.${axis.domain}.shortLabel`)]),
            )}
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
              <div className="font-medium">{t(`axes.${axisScore.axisId}.question`)}</div>
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
          <CardTitle className="text-base">{t("result.bausteineHeading")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("result.bausteineSubtitle")}</p>
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
          <p className="text-sm text-muted-foreground">{t("result.measuresSubtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {measures.map((m) => (
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
          <CardTitle className="text-base">{t("result.signoffHeading")}</CardTitle>
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
