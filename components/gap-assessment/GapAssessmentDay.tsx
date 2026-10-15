"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "@/i18n/navigation";
import { localizeGapDomain } from "@/lib/gap-assessment/localize";
import type { GapDomain, GapQuestion } from "@/lib/gap-assessment/schema";
import { trpc } from "@/lib/trpc/client";
import { QuestionCard } from "./QuestionCard";

interface GapAssessmentDayProps {
  sessionId: string;
  day: number;
  questions: GapQuestion[];
  domains: GapDomain[];
  initialAnswers: Record<string, number>;
}

export function GapAssessmentDay({
  sessionId,
  day,
  questions,
  domains,
  initialAnswers,
}: GapAssessmentDayProps) {
  const t = useTranslations("gap-assessment");
  const locale = useLocale();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveBatch = trpc.gapAssessment.saveBatchAnswers.useMutation();
  const completeMutation = trpc.gapAssessment.completeSession.useMutation();
  const pendingRef = useRef<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const progress = (answeredCount / questions.length) * 100;

  // Group questions by domain
  const domainGroups = domains
    .filter((d) => questions.some((q) => q.domain === d.id))
    .map((d) => ({
      domain: d,
      text: localizeGapDomain(d, locale),
      questions: questions.filter((q) => q.domain === d.id),
    }));

  const flushPending = useCallback(async () => {
    const batch = Object.entries(pendingRef.current).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    if (batch.length === 0) return;
    pendingRef.current = {};
    setSaveStatus("saving");
    await saveBatch.mutateAsync({ sessionId, answers: batch });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }, [sessionId, saveBatch]);

  function handleChange(questionId: string, answer: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    pendingRef.current[questionId] = answer;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushPending, 2000);
  }

  async function handleNavigate(target: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    await flushPending();
    router.push(target as never);
  }

  async function handleComplete() {
    if (timerRef.current) clearTimeout(timerRef.current);
    await flushPending();
    await completeMutation.mutateAsync({ sessionId });
    router.push("/gap-assessment/results");
  }

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dayOf", { current: day, total: 5 })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("questionsAnswered", { answered: answeredCount, total: questions.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="text-xs text-muted-foreground">{t("saving")}</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-green-600">{t("saved")}</span>
          )}
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Day navigation tabs */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((d) => (
          <Button
            key={d}
            variant={d === day ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => d !== day && handleNavigate(`/gap-assessment/${d}`)}
          >
            {t("day", { number: d })}
          </Button>
        ))}
      </div>

      {/* Questions grouped by domain */}
      {domainGroups.map(({ domain, text, questions: domainQuestions }) => (
        <div key={domain.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{text.name}</h2>
          <p className="text-xs text-muted-foreground">{text.description}</p>
          <div className="space-y-2">
            {domainQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={handleChange}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        {day > 1 ? (
          <Button
            variant="outline"
            onClick={() => handleNavigate(`/gap-assessment/${day - 1}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("navigation.previousDay")}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => handleNavigate("/gap-assessment")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("navigation.backToOverview")}
          </Button>
        )}

        {day < 5 ? (
          <Button onClick={() => handleNavigate(`/gap-assessment/${day + 1}`)}>
            {t("navigation.nextDay")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={completeMutation.isPending}>
            <Check className="mr-2 h-4 w-4" />
            {t("navigation.completeAssessment")}
          </Button>
        )}
      </div>
    </div>
  );
}
