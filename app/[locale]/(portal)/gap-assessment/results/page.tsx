import { redirect } from "next/navigation";
import { api } from "@/lib/trpc/server";
import { getGapAssessmentData } from "@/lib/gap-assessment";
import { GapAssessmentResults } from "@/components/gap-assessment/GapAssessmentResults";
import type { AssessmentScores } from "@/lib/gap-assessment/schema";

export const dynamic = "force-dynamic";

export default async function GapAssessmentResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { locale } = await params;
  const { sessionId } = await searchParams;

  const session = await api.gapAssessment.getResults(
    sessionId ? { sessionId } : undefined,
  );

  if (!session || !session.completedAt || !session.scores) {
    redirect("/gap-assessment");
  }

  const data = getGapAssessmentData();

  return (
    <GapAssessmentResults
      sessionId={session.id}
      scores={session.scores as AssessmentScores}
      domains={data.domains}
      questions={data.questions}
      locale={locale}
    />
  );
}
