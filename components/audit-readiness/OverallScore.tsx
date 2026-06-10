"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AssessmentEvaluation } from "@/lib/eval/eval-schema";

const VERDICT_COLOR: Record<string, string> = {
  pass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  fail: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const SCORE_COLOR: Record<string, string> = {
  pass: "text-green-600 dark:text-green-400",
  partial: "text-amber-600 dark:text-amber-400",
  fail: "text-red-600 dark:text-red-400",
};

interface OverallScoreProps {
  result: AssessmentEvaluation;
}

export function OverallScore({ result }: OverallScoreProps) {
  const t = useTranslations("audit-readiness");

  const passCount = result.sections.filter((s) => s.evaluation.verdict === "pass").length;
  const partialCount = result.sections.filter((s) => s.evaluation.verdict === "partial").length;
  const failCount = result.sections.filter((s) => s.evaluation.verdict === "fail").length;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-5xl font-bold tabular-nums ${SCORE_COLOR[result.overallVerdict]}`}>
              {result.overallScore}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t("overallScore")}</div>
          </div>
          <Badge className={`text-sm px-3 py-1 ${VERDICT_COLOR[result.overallVerdict]}`}>
            {t(result.overallVerdict)}
          </Badge>
        </div>
        <div className="flex gap-4 text-sm">
          {passCount > 0 && (
            <span className="text-green-600 dark:text-green-400">
              {t("sectionsPassing", { count: passCount })}
            </span>
          )}
          {partialCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {t("sectionsPartial", { count: partialCount })}
            </span>
          )}
          {failCount > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {t("sectionsFailing", { count: failCount })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
