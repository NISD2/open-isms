import { redirect } from "next/navigation";
import { api } from "@/lib/trpc/server";
import { getGapAssessmentData } from "@/lib/gap-assessment";
import { GapAssessmentDay } from "@/components/gap-assessment/GapAssessmentDay";

export const dynamic = "force-dynamic";

export default async function GapAssessmentDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: dayStr } = await params;
  const day = parseInt(dayStr, 10);

  if (isNaN(day) || day < 1 || day > 5) {
    redirect("/gap-assessment");
  }

  const activeSession = await api.gapAssessment.getActiveSession();
  if (!activeSession) {
    redirect("/gap-assessment");
  }

  const data = getGapAssessmentData();
  const dayQuestions = data.questions.filter((q) => q.day === day);
  const dayDomains = data.domains.filter((d) =>
    dayQuestions.some((q) => q.domain === d.id),
  );

  const existingAnswers: Record<string, number> = {};
  const sessionAnswers = activeSession.answers as Record<string, number>;
  for (const q of dayQuestions) {
    if (sessionAnswers[q.id] !== undefined) {
      existingAnswers[q.id] = sessionAnswers[q.id];
    }
  }

  return (
    <GapAssessmentDay
      sessionId={activeSession.id}
      day={day}
      questions={dayQuestions}
      domains={dayDomains}
      initialAnswers={existingAnswers}
    />
  );
}
