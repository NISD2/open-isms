"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

interface QuizResult {
  score: number;
  passed: boolean;
  corrections: {
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string | null;
  }[];
}

interface QuizFormProps {
  questions: QuizQuestion[];
  passingScore: number;
  onSubmit: (answers: number[]) => Promise<QuizResult>;
  nextLessonHref?: string;
}

export function QuizForm({ questions, passingScore, onSubmit, nextLessonHref }: QuizFormProps) {
  const t = useTranslations("trainingPortal.quiz");
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null),
  );
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const failed = result && !result.passed;

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const res = await onSubmit(answers as number[]);
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      {questions.map((q, qi) => {
        const correction = result?.corrections[qi];
        const wasWrong = correction && !correction.isCorrect;

        return (
          <Card key={q.id} className={correction ? (correction.isCorrect ? "border-green-200" : "border-red-200") : ""}>
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">
                {t("question")} {qi + 1} {t("of")} {questions.length}
              </p>
              <CardTitle className="text-lg font-medium">
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[qi] !== null ? String(answers[qi]) : undefined}
                onValueChange={(v) => {
                  if (result && !failed) return; // lock only if passed
                  const next = [...answers];
                  next[qi] = parseInt(v, 10);
                  setAnswers(next);
                  if (result) setResult(null); // clear old result on any change
                }}
                disabled={result ? !failed : false}
              >
                {q.options.map((opt, oi) => {
                  let optionClass = "";
                  if (correction) {
                    if (oi === correction.correctIndex) optionClass = "text-green-700 font-medium";
                    else if (oi === correction.selectedIndex && !correction.isCorrect) optionClass = "text-red-500 line-through";
                  }

                  return (
                    <div key={oi} className={`flex items-center space-x-2 ${optionClass}`}>
                      <RadioGroupItem value={String(oi)} id={`${q.id}-${oi}`} />
                      <Label htmlFor={`${q.id}-${oi}`} className="cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              {correction && correction.explanation && (
                <p className="mt-3 text-xs text-muted-foreground border-l-2 border-muted pl-3">
                  {t("explanation")}: {correction.explanation}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!result || failed ? (
        <Button onClick={handleSubmit} disabled={!allAnswered || submitting} size="lg">
          {result ? t("submit") : t("submit")}
        </Button>
      ) : (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold">
                {t("score")}: {result.score}% — {t("passed")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("passMessage", { score: result.score })}
              </p>
            </div>
            {nextLessonHref && (
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href={nextLessonHref as never}>
                  {t("nextLesson")}
                  <ChevronRight className="size-3" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
