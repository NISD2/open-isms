import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { GapAssessmentOverview } from "@/components/gap-assessment/GapAssessmentOverview";

export const dynamic = "force-dynamic";

export default async function GapAssessmentPage() {
  const t = await getTranslations("gap-assessment");
  const [activeSession, sessions] = await Promise.all([
    api.gapAssessment.getActiveSession(),
    api.gapAssessment.listSessions(),
  ]);

  const data = (await import("@/lib/gap-assessment")).getGapAssessmentData();
  const totalQuestions = data.questions.length;

  const dayInfo = [
    { day: 1, label: t("overview.day1"), desc: t("overview.day1desc"), questions: data.questions.filter((q) => q.day === 1).length },
    { day: 2, label: t("overview.day2"), desc: t("overview.day2desc"), questions: data.questions.filter((q) => q.day === 2).length },
    { day: 3, label: t("overview.day3"), desc: t("overview.day3desc"), questions: data.questions.filter((q) => q.day === 3).length },
    { day: 4, label: t("overview.day4"), desc: t("overview.day4desc"), questions: data.questions.filter((q) => q.day === 4).length },
    { day: 5, label: t("overview.day5"), desc: t("overview.day5desc"), questions: data.questions.filter((q) => q.day === 5).length },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <GapAssessmentOverview
        activeSession={activeSession ?? null}
        pastSessions={sessions.filter((s) => s.completedAt)}
        dayInfo={dayInfo}
        totalQuestions={totalQuestions}
      />
    </div>
  );
}
