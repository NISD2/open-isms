import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GapAssessmentSharePage } from "@/components/gap-assessment/GapAssessmentSharePage";
import { getGapAssessmentData } from "@/lib/gap-assessment";

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gap-assessment.share" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
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
