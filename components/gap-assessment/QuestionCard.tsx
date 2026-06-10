"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, AlertTriangle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CriticalityValue, GapQuestion } from "@/lib/gap-assessment/schema";
import { ANSWER, CRITICALITY } from "@/lib/gap-assessment/schema";

const CRITICALITY_COLORS: Record<CriticalityValue, string> = {
  [CRITICALITY.LOW]: "text-muted-foreground",
  [CRITICALITY.MEDIUM]: "text-blue-500",
  [CRITICALITY.HIGH]: "text-amber-500",
  [CRITICALITY.CRITICAL]: "text-red-500",
};

interface QuestionCardProps {
  question: GapQuestion;
  value: number | undefined;
  onChange: (questionId: string, answer: number) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const t = useTranslations("gap-assessment");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  const text = locale === "de" ? question.text.de : question.text.en;
  const plainText = locale === "de" ? question.plainText.de : question.plainText.en;

  const answerOptions = [
    { value: ANSWER.YES, label: t("question.yes"), className: "data-[active=true]:bg-green-100 data-[active=true]:border-green-500 data-[active=true]:text-green-700" },
    { value: ANSWER.PARTIALLY, label: t("question.partially"), className: "data-[active=true]:bg-amber-100 data-[active=true]:border-amber-500 data-[active=true]:text-amber-700" },
    { value: ANSWER.NO, label: t("question.no"), className: "data-[active=true]:bg-red-100 data-[active=true]:border-red-500 data-[active=true]:text-red-700" },
    { value: ANSWER.NA, label: t("question.notApplicable"), className: "data-[active=true]:bg-gray-100 data-[active=true]:border-gray-500 data-[active=true]:text-gray-700" },
  ];

  return (
    <Card className={cn(value !== undefined && "border-l-2", value === ANSWER.YES && "border-l-green-500", value === ANSWER.PARTIALLY && "border-l-amber-500", value === ANSWER.NO && "border-l-red-500", value === ANSWER.NA && "border-l-gray-400")}>
      <CardContent className="py-4 space-y-3">
        {/* Question header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">{text}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {question.fineExposure && (
              <Scale className="h-3.5 w-3.5 text-red-500" />
            )}
            <AlertTriangle className={cn("h-3.5 w-3.5", CRITICALITY_COLORS[question.criticality])} />
          </div>
        </div>

        {/* Answer buttons */}
        <div className="flex gap-2 flex-wrap">
          {answerOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-active={value === opt.value}
              onClick={() => onChange(question.id, opt.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                "hover:bg-muted/50",
                opt.className,
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Expandable explanation */}
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? t("question.hideExplanation") : t("question.showExplanation")}
          </button>
          {expanded && (
            <div className="mt-2 rounded-md bg-muted/30 p-3 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{plainText}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{t("question.legalBasis")}: {question.legalBasis}</span>
                <span>{t("question.suggestedRespondent")}: {t(`question.respondent.${question.respondent}`)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
