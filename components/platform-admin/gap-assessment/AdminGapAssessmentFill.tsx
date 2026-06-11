"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GapDomain, GapQuestion } from "@/lib/gap-assessment/schema";

interface AdminGapAssessmentFillProps {
  assessmentId: string;
  initialAnswers: Record<string, number>;
  domains: GapDomain[];
  questions: GapQuestion[];
  locale: string;
}

interface PublishedCredentials {
  shareUrl: string;
  sharePassword: string;
}

const ANSWER_OPTIONS: Array<{ value: number; label: string; key: string }> = [
  { value: -1, label: "N/A", key: "na" },
  { value: 0, label: "No", key: "no" },
  { value: 1, label: "Partial", key: "partial" },
  { value: 2, label: "Yes", key: "yes" },
];

function pickText(s: { en: string; de: string }, locale: string): string {
  return locale === "de" ? s.de : s.en;
}

export function AdminGapAssessmentFill({
  assessmentId,
  initialAnswers,
  domains,
  questions,
  locale,
}: AdminGapAssessmentFillProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [credentials, setCredentials] = useState<PublishedCredentials | null>(null);
  const [revealed, setRevealed] = useState(false);

  const saveMutation = trpc.gapAssessment.saveAnswer.useMutation();
  const publishMutation = trpc.platformAdmin.gapAssessmentPublish.useMutation();

  const byDomain = useMemo(() => {
    const map = new Map<number, GapQuestion[]>();
    for (const q of questions) {
      const list = map.get(q.domain) ?? [];
      list.push(q);
      map.set(q.domain, list);
    }
    return map;
  }, [questions]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  function handleAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setSavingIds((prev) => new Set(prev).add(questionId));
    saveMutation.mutate(
      { sessionId: assessmentId, questionId, answer: value },
      {
        onSettled: () => {
          setSavingIds((prev) => {
            const next = new Set(prev);
            next.delete(questionId);
            return next;
          });
        },
        onError: (err) => {
          toast.error(`Save failed: ${err.message}`);
        },
      },
    );
  }

  async function handleCompleteAndPublish() {
    if (credentials) {
      const confirmed = window.confirm(
        "Re-publishing will invalidate the previous share URL and password. Anyone you sent the old credentials to will lose access. Continue?",
      );
      if (!confirmed) return;
    }
    try {
      const result = await publishMutation.mutateAsync({ assessmentId });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setCredentials({
        shareUrl: `${origin}${result.shareUrl}`,
        sharePassword: result.sharePassword,
      });
      setRevealed(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    }
  }

  function copy(text: string, label: string) {
    void navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied`);
    });
  }

  const isPublishing = publishMutation.isPending;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="bg-background sticky top-0 z-20 -mx-4 mb-4 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Gap Assessment fill</h1>
            <p className="text-muted-foreground text-xs">
              {answeredCount} / {totalQuestions} answered ({progressPct}%) ·
              auto-saved per click
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/platform-admin/gap-assessment" as never)}
            >
              Back
            </Button>
            <Button size="sm" disabled={isPublishing} onClick={handleCompleteAndPublish}>
              {isPublishing
                ? "Publishing..."
                : credentials
                  ? "Re-publish"
                  : "Complete & publish"}
            </Button>
          </div>
        </div>
        <div className="bg-muted mt-2 h-1 overflow-hidden rounded">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {credentials ? (
        <Card className="mb-4 border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="space-y-3 py-4">
            <div className="text-sm font-medium">
              Share credentials (shown once). Save them now — the password
              cannot be displayed again.
            </div>
            <div className="grid grid-cols-[80px_1fr_auto_auto] items-center gap-2 text-sm">
              <span className="text-muted-foreground text-xs uppercase">URL</span>
              <code className="bg-muted truncate rounded px-2 py-1 text-xs">
                {credentials.shareUrl}
              </code>
              <Button variant="outline" size="sm" onClick={() => copy(credentials.shareUrl, "URL")}>
                Copy
              </Button>
              <span />

              <span className="text-muted-foreground text-xs uppercase">Password</span>
              <code className="bg-muted truncate rounded px-2 py-1 font-mono text-xs">
                {revealed ? credentials.sharePassword : "••••••••••••"}
              </code>
              <Button variant="outline" size="sm" onClick={() => setRevealed((v) => !v)}>
                {revealed ? "Hide" : "Reveal"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(credentials.sharePassword, "Password")}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <table className="w-full border-collapse">
        <tbody>
          {domains.map((domain) => {
            const qs = byDomain.get(domain.id) ?? [];
            return (
              <DomainBlock
                key={domain.id}
                domain={domain}
                questions={qs}
                answers={answers}
                savingIds={savingIds}
                locale={locale}
                onAnswer={handleAnswer}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DomainBlock({
  domain,
  questions,
  answers,
  savingIds,
  locale,
  onAnswer,
}: {
  domain: GapDomain;
  questions: GapQuestion[];
  answers: Record<string, number>;
  savingIds: Set<string>;
  locale: string;
  onAnswer: (id: string, value: number) => void;
}) {
  const answeredInDomain = questions.filter((q) => q.id in answers).length;
  return (
    <>
      <tr className="bg-muted/60 sticky top-[64px] z-10">
        <td colSpan={5} className="px-3 py-2">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <span className="text-muted-foreground mr-2 text-xs uppercase">
                {domain.code}
              </span>
              <span className="text-sm font-semibold">
                {pickText(domain.name, locale)}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">
              {answeredInDomain} / {questions.length}
            </span>
          </div>
        </td>
      </tr>
      {questions.map((q) => {
        const current = answers[q.id];
        const isSaving = savingIds.has(q.id);
        return (
          <tr key={q.id} className="border-b last:border-b-0">
            <td className="text-muted-foreground w-20 px-3 py-2 align-top font-mono text-xs">
              {q.id}
              {isSaving ? <span className="ml-2 animate-pulse">…</span> : null}
            </td>
            <td className="px-3 py-2 align-top text-sm">
              {pickText(q.plainText, locale)}
            </td>
            {ANSWER_OPTIONS.map((opt) => {
              const checked = current === opt.value;
              return (
                <td key={opt.key} className="w-20 px-1 py-1 align-top text-center">
                  <label
                    className={`block cursor-pointer rounded border px-2 py-1.5 text-xs transition-colors ${
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt.value}
                      checked={checked}
                      onChange={() => onAnswer(q.id, opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
