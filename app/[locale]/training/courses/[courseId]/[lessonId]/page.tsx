import { getLocale } from "next-intl/server";
import { GetStarted } from "@/components/GetStarted";
import { StuckLink } from "@/components/help/StuckLink";
import { CertificateDownload } from "@/components/training-portal/CertificateDownload";
import { LessonViewerPage } from "@/components/training-portal/LessonViewerPage";
import { getSession } from "@/lib/auth";
import { lessonArt } from "@/lib/training/art";
import { journeyCategoryForLesson } from "@/lib/training/lesson-journey-map";
import { api } from "@/lib/trpc/server";

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

  // The certificate sits on each course's final lesson. It used to match the
  // NIS 2 CEO course's "certificate-of-completion" slug, so the other courses,
  // whose final lesson is the attestation quiz, never offered their PDF.
  const isFinalLesson = lessonData.lesson.nextLessonId === null;

  const completion = isFinalLesson
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
        image={lessonArt(courseId, lessonId)}
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
          {/* The walk's home takes a finisher from wherever they stand: not set
              up yet, it opens on setting the company up; not paid, it shows the
              way to order. */}
          {completion.allCompleted && <GetStarted href="/durchgang/nis2" />}
          {/* End of the course is the second place someone stalls: they have
              the theory and no next step. Same one-line offer as the
              requirement sidebar, below the certificate rather than above it,
              so finishing is still the headline.

              Gated on allCompleted like GetStarted above, not on
              `completion` being non-null: completion is fetched for the
              certificate lesson whatever the progress, so opening it two
              modules in used to show end-of-course help to someone who has
              not got the theory yet. */}
          {completion.allCompleted && <StuckLink />}
        </div>
      )}
    </>
  );
}
