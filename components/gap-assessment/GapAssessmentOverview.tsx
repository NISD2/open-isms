"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";

interface DayInfo {
  day: number;
  label: string;
  desc: string;
  questions: number;
}

interface Session {
  id: string;
  createdAt: Date;
  completedAt: Date | null;
  scores: unknown;
}

export function GapAssessmentOverview({
  activeSession,
  pastSessions,
  dayInfo,
  totalQuestions,
}: {
  activeSession: { id: string; answers: Record<string, number> } | null;
  pastSessions: Session[];
  dayInfo: DayInfo[];
  totalQuestions: number;
}) {
  const t = useTranslations("gap-assessment");
  const router = useRouter();
  const startMutation = trpc.gapAssessment.startSession.useMutation();

  const answeredCount = activeSession
    ? Object.keys(activeSession.answers).length
    : 0;

  async function handleStart() {
    const session = await startMutation.mutateAsync();
    if (session) {
      router.push({ pathname: "/gap-assessment/[day]", params: { day: "1" } });
    }
  }

  function getCurrentDay(): number {
    if (!activeSession) return 1;
    const answered = new Set(Object.keys(activeSession.answers));
    for (const d of dayInfo) {
      const dayQuestionCount = d.questions;
      // Simple heuristic: if not all questions in a day are answered, that's the current day
      // This is approximate — the real check would need question IDs per day
      if (answered.size < dayInfo.slice(0, d.day).reduce((sum, di) => sum + di.questions, 0)) {
        return d.day;
      }
    }
    return 5;
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{t("overview.description")}</p>
        </CardContent>
      </Card>

      {/* Day cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dayInfo.map((d) => (
          <Card key={d.day} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{t("day", { number: d.day })}</Badge>
                <span className="text-xs text-muted-foreground">
                  {t("overview.questions", { count: d.questions })}
                </span>
              </div>
              <CardTitle className="text-base">{d.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{d.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {activeSession ? (
          <>
            <Button asChild>
              <Link
                href={{
                  pathname: "/gap-assessment/[day]",
                  params: { day: String(getCurrentDay()) },
                }}
              >
                {t("resumeAssessment")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="self-center text-sm text-muted-foreground">
              {t("questionsAnswered", { answered: answeredCount, total: totalQuestions })}
            </p>
          </>
        ) : (
          <Button onClick={handleStart} disabled={startMutation.isPending}>
            {t("startAssessment")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("overview.pastSessions")}</h2>
          <div className="space-y-2">
            {pastSessions.map((s) => {
              const scores = s.scores as { overall: number } | null;
              return (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">
                          {scores ? t("overview.score", { score: scores.overall }) : ""}
                        </p>
                        {s.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            {t("overview.completedOn", {
                              date: new Date(s.completedAt).toLocaleDateString(),
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={{
                          pathname: "/gap-assessment/results",
                          query: { sessionId: s.id },
                        }}
                      >
                        {t("viewResults")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
