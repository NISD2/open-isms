"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AssessmentEvaluation } from "@/lib/eval/eval-schema";
import { trpc } from "@/lib/trpc/client";
import { trpcErrorCode } from "@/lib/trpc/error-message";
import { OverallScore } from "./OverallScore";
import { SectionCard } from "./SectionCard";

export function AuditReadinessPage() {
  const t = useTranslations("audit-readiness");
  const locale = useLocale();
  const [result, setResult] = useState<AssessmentEvaluation | null>(null);
  const [isPending, startTransition] = useTransition();
  const [reEvaluatingCode, setReEvaluatingCode] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const evaluateAll = trpc.llm.evaluateAll.useMutation();
  const evaluateSection = trpc.llm.evaluateSection.useMutation();

  function handleStartEvaluation() {
    setRateLimited(false);
    startTransition(async () => {
      try {
        setResult(await evaluateAll.mutateAsync({ locale }));
      } catch (err) {
        // The hourly AI budget is the one refusal a person can resolve by
        // waiting, so it gets a line on the page; anything else still goes to
        // the error boundary as before.
        if (trpcErrorCode(err) !== "TOO_MANY_REQUESTS") throw err;
        setRateLimited(true);
      }
    });
  }

  function handleReEvaluate(categoryCode: string) {
    setRateLimited(false);
    setReEvaluatingCode(categoryCode);
    evaluateSection
      .mutateAsync({ categoryCode, locale })
      .then((updated) => {
        setResult((prev) => {
          if (!prev) return prev;
          const sections = prev.sections.map((s) =>
            s.categoryCode === categoryCode ? { ...updated } : s,
          );
          const scores = sections.map((s) => s.evaluation.score);
          const overallScore = Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length,
          );
          const hasAnyFail = sections.some((s) => s.evaluation.verdict === "fail");
          const allPass = sections.every((s) => s.evaluation.verdict === "pass");
          const overallVerdict = allPass ? "pass" : hasAnyFail ? "fail" : "partial";
          return { overallVerdict, overallScore, sections };
        });
        setReEvaluatingCode(null);
      })
      .catch((err: unknown) => {
        setRateLimited(trpcErrorCode(err) === "TOO_MANY_REQUESTS");
        setReEvaluatingCode(null);
      });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {rateLimited && (
        <p role="alert" className="mb-6 text-sm text-destructive">
          {t("rateLimited")}
        </p>
      )}

      {!result && (
        <div className="flex flex-col items-center gap-4 py-16">
          <Button size="lg" onClick={handleStartEvaluation} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {t("evaluating")}
              </>
            ) : (
              t("startEvaluation")
            )}
          </Button>
          <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <OverallScore result={result} />

          <div className="grid gap-4 sm:grid-cols-2">
            {result.sections.map((section) => (
              <SectionCard
                key={section.categoryCode}
                categoryCode={section.categoryCode}
                categoryName={section.categoryName}
                bsigSection={section.bsigSection}
                evaluation={section.evaluation}
                onReEvaluate={handleReEvaluate}
                isReEvaluating={reEvaluatingCode === section.categoryCode}
              />
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleStartEvaluation}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t("evaluating")}
                </>
              ) : (
                t("startEvaluation")
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pb-4">
            {t("disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}
