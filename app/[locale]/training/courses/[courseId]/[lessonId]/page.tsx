import { api } from "@/lib/trpc/server";
import { getLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { journeyCategoryForLesson } from "@/lib/training/lesson-journey-map";
import { LessonViewerPage } from "@/components/training-portal/LessonViewerPage";
import { CertificateDownload } from "@/components/training-portal/CertificateDownload";
import { StartJourneyCta } from "@/components/training-portal/StartJourneyCta";
import { StuckLink } from "@/components/help/StuckLink";

export default async function LessonRoute({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const locale = await getLocale();

  const [lessonData, quizData] = await Promise.all([
    api.trainingPortal.getLesson({ courseId, lessonId, locale }),
    api.trainingPortal.getQuiz({ courseId, lessonId, locale }).catch(() => null),
  ]);

  const isCertificateLesson = lessonData.lesson.slug === "certificate-of-completion";

  const completion = isCertificateLesson
    ? await api.trainingCertificate.getCourseCompletion({ courseId })
    : null;

  // Per-lesson journey link only where it can actually work: the NIS2 course,
  // for a user who has a company (so the journey is populated) and passes the
  // journey flag. Other courses reuse lesson IDs, so the nis2-ceo-only map
  // must not leak into them.
  let journeyCategory: string | null = null;
  const session = await getSession();
  if (courseId === "nis2-ceo" && session?.companyId) {
    journeyCategory = journeyCategoryForLesson(lessonId);
  }

  async function handleSubmitQuiz(answers: number[]) {
    "use server";
    return api.trainingPortal.submitQuiz({ courseId, lessonId, locale, answers });
  }

  async function handleCompleteLesson() {
    "use server";
    await api.trainingPortal.completeLesson({ courseId, lessonId });
  }

  return (
    <>
      <LessonViewerPage
        lesson={lessonData.lesson}
        html={lessonData.html}
        sidebarTerms={lessonData.sidebarTerms}
        quiz={quizData}
        progress={lessonData.progress}
        courseId={courseId}
        journeyCategory={journeyCategory}
        onSubmitQuiz={handleSubmitQuiz}
        onCompleteLesson={handleCompleteLesson}
      />
      {completion && (
        <div className="mt-8 space-y-6">
          <CertificateDownload
            courseId={courseId}
            locale={locale}
            allCompleted={completion.allCompleted}
            completedCount={completion.completedCount}
            totalCount={completion.totalCount}
            userName={completion.userName}
          />
          {completion.allCompleted && <StartJourneyCta locale={locale} />}
          {/* End of the course is the second place someone stalls: they have
              the theory and no next step. Same one-line offer as the
              requirement sidebar, below the certificate rather than above it,
              so finishing is still the headline. */}
          <StuckLink />
        </div>
      )}
    </>
  );
}
