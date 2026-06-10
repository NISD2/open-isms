"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SectionEvaluation } from "@/lib/eval/eval-schema";

const VERDICT_COLOR: Record<string, string> = {
  pass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  fail: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const PROGRESS_COLOR: Record<string, string> = {
  pass: "[&>div]:bg-green-500",
  partial: "[&>div]:bg-amber-500",
  fail: "[&>div]:bg-red-500",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  important: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "nice-to-have": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

interface SectionCardProps {
  categoryCode: string;
  categoryName: string;
  bsigSection: string;
  evaluation: SectionEvaluation;
  onReEvaluate: (code: string) => void;
  isReEvaluating: boolean;
}

export function SectionCard({
  categoryCode,
  categoryName,
  bsigSection,
  evaluation,
  onReEvaluate,
  isReEvaluating,
}: SectionCardProps) {
  const t = useTranslations("audit-readiness");
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight">
              <span className="font-mono text-xs text-muted-foreground mr-1.5">{categoryCode}</span>
              {categoryName}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{bsigSection}</p>
          </div>
          <Badge className={`shrink-0 ${VERDICT_COLOR[evaluation.verdict]}`}>
            {t(evaluation.verdict)}
          </Badge>
        </div>
        <Progress
          value={evaluation.score}
          className={`h-2 mt-2 ${PROGRESS_COLOR[evaluation.verdict]}`}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground tabular-nums">{evaluation.score}%</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onReEvaluate(categoryCode)}
            disabled={isReEvaluating}
          >
            {isReEvaluating ? (
              <>
                <Loader2 className="size-3 mr-1 animate-spin" />
                {t("reEvaluating")}
              </>
            ) : (
              t("reEvaluate")
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{evaluation.summary}</p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary mt-3 hover:underline"
        >
          {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          {expanded ? t("hideDetails") : t("showDetails")}
        </button>

        {expanded && (
          <div className="mt-3 space-y-4">
            {evaluation.strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-1">{t("strengths")}</h4>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i}>+ {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation.structureGaps.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-1">{t("structureGaps")}</h4>
                <ul className="space-y-1">
                  {evaluation.structureGaps.map((gap, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${SEVERITY_COLOR[gap.severity]}`}>
                        {t(`severity.${gap.severity}`)}
                      </Badge>
                      <span className="text-muted-foreground">{gap.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation.dataGaps.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-1">{t("dataGaps")}</h4>
                <div className="space-y-2">
                  {evaluation.dataGaps.map((gap, i) => (
                    <div key={i} className="text-xs border rounded-md p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLOR[gap.severity]}`}>
                          {t(`severity.${gap.severity}`)}
                        </Badge>
                        <span className="font-mono text-muted-foreground">{gap.requirementCode}</span>
                        {gap.fieldKey && (
                          <span className="text-muted-foreground">/ {gap.fieldKey}</span>
                        )}
                      </div>
                      <p className="text-muted-foreground">{gap.issue}</p>
                      <p className="text-primary mt-0.5">{gap.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {evaluation.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-1">{t("recommendations")}</h4>
                <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                  {evaluation.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
