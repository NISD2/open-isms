"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  ART21_MEASURES,
  bausteineForVariante,
} from "@/lib/risk-assessment/recommendations";
import {
  schutzbedarfBadgeStyle,
  varianteBadgeStyle,
} from "@/lib/risk-assessment/styles";
import type { Grundwert, MatrixResult, Schutzbedarf } from "@/lib/risk-assessment/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResultPanelProps {
  result: MatrixResult;
}

// Order V, I, A consistently across the audit panel.
const GRUNDWERTE: Grundwert[] = ["v", "i", "a"];

// Map Schutzbedarf class → i18n key suffix in the bundle.
const SCHUTZBEDARF_LABEL_KEY: Record<Schutzbedarf, string> = {
  normal: "normal",
  hoch: "hoch",
  sehrHoch: "sehrHoch",
};

/**
 * Detail sections rendered BELOW the top ResultCard once the user has
 * completed the quiz. The top card carries the friendly badge + radar +
 * answers; this panel carries the audit-grade methodology breakdown plus
 * the per-axis justification, Bausteine, and Art 21(2) measures.
 */
export function ResultPanel({ result }: ResultPanelProps) {
  const t = useTranslations("riskAssessment");
  const { schutzbedarf, absicherungsvariante, friendlyTier } = result;
  const bausteine = bausteineForVariante(friendlyTier);

  return (
    <div className="space-y-8">
      {/* ── BSI-200-2 Schutzbedarfsfeststellung detail ──────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("schutzbedarf.heading")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("schutzbedarf.subtitle")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {GRUNDWERTE.map((g) => {
              const result = schutzbedarf[g];
              return (
                <div
                  key={g}
                  className="rounded-md border bg-card p-3 space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-xs uppercase tracking-wide font-medium">
                      {t(`schutzbedarf.grundwerte.${g}.shortLabel`)}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        schutzbedarfBadgeStyle(result.class),
                      )}
                    >
                      {t(`schutzbedarf.classes.${SCHUTZBEDARF_LABEL_KEY[result.class]}.label`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(`schutzbedarf.grundwerte.${g}.description`)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-md border-2 border-foreground/10 bg-muted/30 p-3 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-xs uppercase tracking-wide font-medium">
                {t("schutzbedarf.gesamtLabel")}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1",
                  schutzbedarfBadgeStyle(schutzbedarf.gesamt),
                )}
              >
                {t(`schutzbedarf.classes.${SCHUTZBEDARF_LABEL_KEY[schutzbedarf.gesamt]}.label`)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.rich("schutzbedarf.gesamtBody", {
                grundwert: () => (
                  <span className="font-medium text-foreground">
                    {t(`schutzbedarf.grundwerte.${schutzbedarf.drivingGrundwert}.shortLabel`)}
                  </span>
                ),
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Recommended Absicherungsvariante ────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("variante.heading")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("variante.subtitle")}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-sm">
              {t("variante.recommendedLabel")}
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-sm px-3 py-1",
                varianteBadgeStyle(absicherungsvariante.final),
              )}
            >
              {t(`tiers.${absicherungsvariante.final}.label`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(`variante.byVariante.${absicherungsvariante.final}.description`)}
          </p>

          {absicherungsvariante.bumpedByHints && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm space-y-1">
              <div className="font-medium text-amber-800 dark:text-amber-200">
                {t("variante.bumpedTitle")}
              </div>
              <p className="text-amber-700/90 dark:text-amber-300/90">
                {t("variante.bumpedBody")}
              </p>
              <ul className="mt-1 list-disc pl-5 text-xs text-amber-700/90 dark:text-amber-300/90">
                {absicherungsvariante.bumpingHintAxisIds.map((id) => (
                  <li key={id}>{t(`axes.${id}.shortLabel`)}</li>
                ))}
              </ul>
            </div>
          )}

          {absicherungsvariante.risikoanalyseRequired && (
            <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm flex gap-3">
              <AlertTriangle className="h-4 w-4 flex-none text-red-700 dark:text-red-300 mt-0.5" />
              <div className="space-y-1">
                <div className="font-medium text-red-800 dark:text-red-200">
                  {t("variante.risikoanalyseTitle")}
                </div>
                <p className="text-red-700/90 dark:text-red-300/90">
                  {t("variante.risikoanalyseBody")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Per-axis justification (all 8 axes) ─────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("result.whyHeading")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("result.whySubtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
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
        <CardContent className="space-y-3 text-sm">
          {ART21_MEASURES.map((m) => (
            <div key={m} className="flex gap-3">
              <Badge variant="outline" className="font-mono text-xs shrink-0 h-fit">
                {m}
              </Badge>
              <div className="space-y-0.5">
                <div>{t(`art21Measures.${m}.label`)}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {t(`art21Measures.${m}.refs`)}
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            {t("result.cirNote")}
          </p>
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
