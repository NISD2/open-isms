import { api } from "@/lib/trpc/server";
import { getLocale } from "next-intl/server";
import { LessonViewerPage } from "@/components/training-portal/LessonViewerPage";
import { CertificateDownload } from "@/components/training-portal/CertificateDownload";

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
        onSubmitQuiz={handleSubmitQuiz}
        onCompleteLesson={handleCompleteLesson}
      />
      {completion && (
        <div className="mt-8">
          <CertificateDownload
            courseId={courseId}
            locale={locale}
            allCompleted={completion.allCompleted}
            completedCount={completion.completedCount}
            totalCount={completion.totalCount}
            userName={completion.userName}
          />
        </div>
      )}
    </>
  );
}
