"use client";

import { useTranslations } from "next-intl";
import { AXES } from "@/lib/risk-assessment/axes";
import {
  ART21_MEASURES,
  bausteineForTier,
} from "@/lib/risk-assessment/recommendations";
import type { MatrixResult } from "@/lib/risk-assessment/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResultPanelProps {
  result: MatrixResult;
}

/**
 * Detail sections rendered BELOW the top ResultCard once the user has
 * completed the quiz. The top card carries the tier badge, radar, and
 * answers — those don't repeat here.
 */
export function ResultPanel({ result }: ResultPanelProps) {
  const t = useTranslations("riskAssessment");
  const finalTier = result.finalTier;
  const bausteine = bausteineForTier(finalTier);

  const hardStopNotes: string[] = [];
  result.axisScores.forEach((axisScore) => {
    const axis = AXES.find((a) => a.id === axisScore.axisId);
    if (axis?.hardStop && axisScore.score === axis.hardStop.triggerScore) {
      hardStopNotes.push(t(`hardStops.${axis.hardStop.noteKey}`));
    }
  });

  return (
    <div className="space-y-8">
      {hardStopNotes.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6 space-y-2 text-sm text-amber-700 dark:text-amber-300">
            {hardStopNotes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </CardContent>
        </Card>
      )}

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
