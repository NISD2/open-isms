import type { Metadata } from "next";
import { getGapAssessmentData } from "@/lib/gap-assessment";
import { GapAssessmentSharePage } from "@/components/gap-assessment/GapAssessmentSharePage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shared gap assessment",
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function GapAssessmentSharedRoute({ params }: PageProps) {
  const { locale, token } = await params;
  const data = getGapAssessmentData();

  return (
    <GapAssessmentSharePage
      token={token}
      locale={locale}
      domains={data.domains}
      questions={data.questions}
    />
  );
}
