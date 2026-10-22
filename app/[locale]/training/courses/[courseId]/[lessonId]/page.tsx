import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { headlinesOf } from "@/app/[locale]/(portal)/durchgang/_walk/load";
import { GetStarted } from "@/components/GetStarted";
import { StuckLink } from "@/components/help/StuckLink";
import { AfterTrainingStep } from "@/components/training-portal/AfterTrainingStep";
import { CertificateDownload } from "@/components/training-portal/CertificateDownload";
import { LessonViewerPage } from "@/components/training-portal/LessonViewerPage";
import { lessonArt } from "@/lib/training/art";
import { isCourseLesson, loadCourse, loadLesson } from "@/lib/training/course-loader";
import { walkItemForLesson } from "@/lib/training/lesson-journey-map";
import { api } from "@/lib/trpc/server";

const MANAGEMENT_TRAINING = "nis2-ceo";

/**
 * The certificate picture on the management training's first lesson, in the reader's language
 * where one is drawn (scripts/render-certificate-sample.tsx), else the English one.
 */
function certificateSampleFor(courseId: string, lessonId: string, locale: string) {
  if (courseId !== MANAGEMENT_TRAINING || lessonId !== "0.1") return null;
  return `/images/training/certificate-sample-${locale === "de" ? "de" : "en"}.webp`;
}

/** The tab names the lesson and the course, instead of the home page's title. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<Metadata> {
  const [{ courseId, lessonId }, locale] = await Promise.all([params, getLocale()]);
  // Both ids come from the URL: only a known course's current lesson is loaded (loadLesson builds
  // an import path from the id without checking it).
  const known = await isCourseLesson(courseId, lessonId).catch(() => false);
  if (!known) return {};
  const [course, lesson] = await Promise.all([
    loadCourse(courseId),
    loadLesson(courseId, lessonId),
  ]);
  return {
    title: `${lesson.title[locale] ?? lesson.title.en} · ${course.title[locale] ?? course.title.en}`,
  };
}

/**
 * The walk item a lesson leads to, named by the walk's own headline. The NIS2 course only: the
 * other courses reuse its lesson IDs, so its map must not leak into them. The walk's gates take it
 * from there (not set up, not paid).
 */
async function walkLinkFor(courseId: string, lessonId: string) {
  const code = courseId === MANAGEMENT_TRAINING ? walkItemForLesson(lessonId) : null;
  if (!code) return null;
  const headline = (await headlinesOf([code])).get(code);
  return headline ? { code, headline } : null;
}

export default async function LessonRoute({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const locale = await getLocale();

  const [lessonData, quizData, walkLink, course] = await Promise.all([
    api.trainingPortal.getLesson({ courseId, lessonId, locale }),
    api.trainingPortal.getQuiz({ courseId, lessonId, locale }).catch(() => null),
    walkLinkFor(courseId, lessonId),
    loadCourse(courseId),
  ]);

  // The certificate sits on each course's final lesson. It used to match the
  // NIS 2 CEO course's "certificate-of-completion" slug, so the other courses,
  // whose final lesson is the attestation quiz, never offered their PDF.
  const isFinalLesson = lessonData.lesson.nextLessonId === null;

  const completion = isFinalLesson
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
        courseTitle={course.title[locale] ?? course.title.en ?? courseId}
        showWalkCta={courseId === MANAGEMENT_TRAINING}
        image={lessonArt(courseId, lessonId)}
        certificateSample={certificateSampleFor(courseId, lessonId, locale)}
        walkLink={walkLink}
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
              way to order. The management training ends on the duty that follows
              it (§ 38 Abs. 1 BSIG) instead of the general ask. */}
          {completion.allCompleted &&
            (courseId === "nis2-ceo" ? (
              <AfterTrainingStep />
            ) : (
              <GetStarted variant="landing" href="/durchgang/nis2" />
            ))}
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
