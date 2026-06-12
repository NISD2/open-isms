"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { AXES } from "@/lib/risk-assessment/axes";
import { hasAllAnswers, scoreMatrix } from "@/lib/risk-assessment/scoring";
import { domainStyle } from "@/lib/risk-assessment/styles";
import type { Answers, MatrixResult } from "@/lib/risk-assessment/types";
import { cn } from "@/lib/utils";

interface RiskAssessmentToolProps {
  /** Fired when the user has answered all axes and clicked "show result".
   *  The parent shell owns the result state so the top ResultCard can
   *  update in place — this component only collects answers. */
  onComplete: (result: MatrixResult) => void;
}

export function RiskAssessmentTool({ onComplete }: RiskAssessmentToolProps) {
  const t = useTranslations("riskAssessment");
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalQuestions = AXES.length;
  const currentAxis = AXES[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentSelection = currentAxis ? answers[currentAxis.id] : undefined;
  const allAnswered = useMemo(() => hasAllAnswers(answers), [answers]);

  const progress = useMemo(() => {
    const answeredCount = AXES.filter((axis) => Boolean(answers[axis.id])).length;
    return Math.round((answeredCount / totalQuestions) * 100);
  }, [answers, totalQuestions]);

  function handleSelect(optionId: string) {
    if (!currentAxis) return;
    setAnswers((prev) => ({ ...prev, [currentAxis.id]: optionId }));
  }

  function goNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function goBack() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function showResult() {
    if (allAnswered) {
      onComplete(scoreMatrix(answers));
    }
  }

  if (!currentAxis) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("steps.questionLabel", {
              current: currentIndex + 1,
              total: totalQuestions,
            })}
          </span>
          <Badge variant="outline" className={cn(domainStyle(currentAxis.domain, "pill"))}>
            {t(`domains.${currentAxis.domain}.shortLabel`)}
          </Badge>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-tight">
            {t(`axes.${currentAxis.id}.question`)}
          </CardTitle>
          <CardDescription>
            {t(`domains.${currentAxis.domain}.description`)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentSelection ?? ""}
            onValueChange={handleSelect}
            className="space-y-3"
          >
            {currentAxis.options.map((option) => {
              const optionLabel = t(`axes.${currentAxis.id}.options.${option.id}.label`);
              const inputId = `${currentAxis.id}-${option.id}`;
              const isSelected = currentSelection === option.id;
              return (
                <Label
                  key={option.id}
                  htmlFor={inputId}
                  className={cn(
                    "flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors",
                    isSelected
                      ? "border-foreground bg-muted"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <RadioGroupItem
                    id={inputId}
                    value={option.id}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-snug">{optionLabel}</span>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("steps.back")}
        </Button>
        {isLastQuestion ? (
          <Button onClick={showResult} disabled={!allAnswered}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t("steps.showResult")}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!currentSelection}>
            {t("steps.next")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
