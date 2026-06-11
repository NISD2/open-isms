import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";
import { getGapAssessmentData } from "@/lib/gap-assessment";
import { AdminGapAssessmentFill } from "@/components/platform-admin/gap-assessment/AdminGapAssessmentFill";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminGapAssessmentFillRoute({ params }: PageProps) {
  await requirePlatformAdmin();
  const { locale, id } = await params;

  const session = await api.gapAssessment.getResults({ sessionId: id });
  if (!session) {
    notFound();
  }

  const data = getGapAssessmentData();

  return (
    <AdminGapAssessmentFill
      assessmentId={session.id}
      initialAnswers={(session.answers as Record<string, number>) ?? {}}
      domains={data.domains}
      questions={data.questions}
      locale={locale}
    />
  );
}
