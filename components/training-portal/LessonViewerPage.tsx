"use client";

import { BookOpen, Check, ChevronLeft, ChevronRight, Video } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Art } from "@/components/durchgang/Art";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useRouter } from "@/i18n/navigation";
import type { Lesson } from "@/lib/training/schemas";
import { CoursePortalCta } from "./CoursePortalCta";
import { DictionarySidebar } from "./DictionarySidebar";
import { QuizForm } from "./QuizForm";
import { TermHoverProvider, useTermHover } from "./TermHoverContext";
import { WalkLink } from "./WalkLink";

interface SidebarTerm {
  term: string;
  type: "defined" | "vocabulary";
  definition: string;
}

interface QuizData {
  lessonId: string;
  passingScore: number;
  questions: { id: string; question: string; options: string[] }[];
}

interface LessonViewerPageProps {
  lesson: Lesson;
  html: string;
  sidebarTerms: SidebarTerm[];
  quiz: QuizData | null;
  progress: { completed: boolean; quizPassed: boolean | null } | null;
  courseId: string;
  /** The course's name in the reader's language, the title above every lesson. */
  courseTitle: string;
  /** Whether the course leads into the NIS 2 walkthrough (the management training only). */
  showWalkCta: boolean;
  /** The lesson's picture (lib/training/art.ts), or null where none is drawn. */
  image: string | null;
  /**
   * The certificate a finisher gets, as a picture, on the course's first lesson only: the reason
   * to carry on is shown before the first long text, not promised at the end.
   */
  certificateSample: string | null;
  /** The walk item this lesson leads to, with its headline, or null (decided server-side). */
  walkLink: { code: string; headline: string; image: string | null } | null;
  onSubmitQuiz: (answers: number[]) => Promise<{
    score: number;
    passed: boolean;
    corrections: {
      questionId: string;
      selectedIndex: number;
      correctIndex: number;
      isCorrect: boolean;
      explanation: string | null;
    }[];
  }>;
  onCompleteLesson: () => Promise<void>;
}

/** Article with event delegation for term hover */
function LessonArticle({ html }: { html: string }) {
  const articleRef = useRef<HTMLElement>(null);
  const { activeTermSlug, setActiveTermSlug } = useTermHover();

  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-term]");
      if (target) {
        const slug = target.getAttribute("data-term");
        if (slug) setActiveTermSlug(slug);
      }
    },
    [setActiveTermSlug],
  );

  const handleMouseOut = useCallback(
    (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-term]");
      if (target) setActiveTermSlug(null);
    },
    [setActiveTermSlug],
  );

  // Attach event delegation listeners
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    el.addEventListener("mouseover", handleMouseOver);
    el.addEventListener("mouseout", handleMouseOut);
    return () => {
      el.removeEventListener("mouseover", handleMouseOver);
      el.removeEventListener("mouseout", handleMouseOut);
    };
  }, [handleMouseOver, handleMouseOut]);

  // Apply/remove highlight class on term spans when activeTermSlug changes from sidebar
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    const termSpans = el.querySelectorAll<HTMLElement>("[data-term]");
    termSpans.forEach((span) => {
      if (activeTermSlug && span.getAttribute("data-term") === activeTermSlug) {
        span.classList.add("term--highlighted");
      } else {
        span.classList.remove("term--highlighted");
      }
    });
  }, [activeTermSlug]);

  // Every lesson text opens with its own "Lesson x.y: title" heading, which repeats the page's.
  return (
    <article
      ref={articleRef}
      className="prose prose-sm max-w-none dark:prose-invert lesson-content [&>h1:first-child]:hidden"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the lesson HTML is rendered on the server from the course markdown in this repo, not from user input
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function LessonViewerPage({
  lesson,
  html,
  sidebarTerms,
  quiz,
  progress,
  courseId,
  courseTitle,
  showWalkCta,
  image,
  certificateSample,
  walkLink,
  onSubmitQuiz,
  onCompleteLesson,
}: LessonViewerPageProps) {
  const t = useTranslations("trainingPortal");
  const locale = useLocale();
  const router = useRouter();
  const [completed, setCompleted] = useState(progress?.completed ?? false);

  const defaultTab = lesson.videoUrl ? "video" : "text";

  async function handleComplete() {
    await onCompleteLesson();
    setCompleted(true);
    router.refresh();
  }

  /**
   * Previous and Next open the other lesson at its top. The page scrolls the window, not the
   * portal's main area, and Next.js only scrolls far enough to show the new segment, which left a
   * reader halfway down. Scrolling here, at the click, rather than on every mount keeps a link
   * to an anchor and the back button's restored position working.
   */
  function openLesson(lessonId: string) {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    router.push(
      {
        pathname: "/training/courses/[courseId]/[lessonId]",
        params: { courseId, lessonId },
      },
      { scroll: false },
    );
  }

  /**
   * A lesson without a quiz (the introduction) is done once it has been read, so moving on records
   * it instead of asking for a separate "mark as complete" first. A quiz lesson is only ever done
   * through its quiz; Next skips ahead without recording it.
   */
  async function handleNext(nextId: string) {
    if (!quiz && !completed) {
      try {
        await onCompleteLesson();
      } catch {
        // A lesson that is not recorded keeps the certificate closed, so the reader hears it here
        // and can try again, rather than finding 46 of 47 at the end.
        toast.error(t("lessonSaveFailed"));
        return;
      }
    }
    openLesson(nextId);
    router.refresh();
  }

  return (
    <TermHoverProvider>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={{ pathname: "/training/courses/[courseId]", params: { courseId } }}
            className="text-xl font-semibold tracking-tight transition-colors hover:text-primary sm:text-2xl"
          >
            {courseTitle}
          </Link>
          {showWalkCta ? <CoursePortalCta locale={locale} /> : null}
        </div>
        {/* Content + Dictionary layout: the rail starts level with the lesson's picture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Content (2/3) */}
          <div className="lg:col-span-2">
            {certificateSample ? (
              // Caption beside the picture on a wide screen, so the lesson text still starts
              // above the fold; stacked on a phone.
              <figure className="mb-8 flex flex-col gap-5 overflow-hidden rounded-3xl bg-primary/[0.06] px-6 pt-6 sm:flex-row sm:items-end sm:gap-8 sm:px-8">
                <figcaption className="sm:max-w-[16rem] sm:self-center sm:pb-6">
                  <p className="text-lg font-semibold tracking-tight">
                    {t("certificatePreview.title")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t("certificatePreview.body")}
                  </p>
                </figcaption>
                <Image
                  src={certificateSample}
                  alt={t("certificatePreview.alt")}
                  width={1200}
                  height={848}
                  priority
                  className="mx-auto h-auto w-full max-w-sm rounded-t-xl border border-b-0 border-border/70 bg-white shadow-sm sm:mx-0 sm:ml-auto"
                />
              </figure>
            ) : (
              image && (
                <div className="mb-8 flex h-44 items-end justify-center overflow-hidden rounded-3xl bg-primary/[0.06] sm:h-52">
                  <Art src={image} className="h-40 translate-y-2 sm:h-48" />
                </div>
              )
            )}
            <p className="text-sm text-muted-foreground mb-1">
              {t("lesson")} {lesson.id} ·{" "}
              {t("estimatedTime", { minutes: lesson.estimatedMinutes })}
            </p>
            <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              {lesson.title[locale] ?? lesson.title.en}
            </h1>
            {walkLink ? (
              <WalkLink {...walkLink} lessonId={lesson.id} locale={locale} />
            ) : null}
            <Tabs defaultValue={defaultTab}>
              {lesson.videoUrl && (
                <TabsList className="mb-4">
                  <TabsTrigger value="video" className="gap-2">
                    <Video className="h-4 w-4" />
                    {t("videoView")}
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    {t("textView")}
                  </TabsTrigger>
                </TabsList>
              )}

              {lesson.videoUrl && (
                <TabsContent value="video">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                      src={lesson.videoUrl}
                      title={lesson.title[locale] ?? lesson.title.en}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </TabsContent>
              )}

              <TabsContent value="text">
                <LessonArticle html={html} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Dictionary sidebar (1/3) */}
          <div className="hidden lg:block">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              {t("dictionary")}
            </h2>
            <DictionarySidebar terms={sidebarTerms} />
          </div>
        </div>

        {/* Quiz or complete button */}
        {quiz && !completed ? (
          <QuizForm
            questions={quiz.questions}
            passingScore={quiz.passingScore}
            nextLessonHref={
              lesson.nextLessonId
                ? `/training/courses/${courseId}/${lesson.nextLessonId}`
                : undefined
            }
            onSubmit={async (answers) => {
              const result = await onSubmitQuiz(answers);
              if (result.passed) {
                setCompleted(true);
                router.refresh();
              }
              return result;
            }}
          />
        ) : !quiz && !completed ? (
          // Next records a lesson without a quiz, so the button is quiet where there is a Next; it
          // stays for whoever leaves through the sidebar instead. The last lesson has no Next, so
          // there it is the one action.
          <Button
            onClick={handleComplete}
            size={lesson.nextLessonId ? "default" : "lg"}
            variant={lesson.nextLessonId ? "outline" : "default"}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            {t("completeLesson")}
          </Button>
        ) : completed ? (
          <p className="text-sm text-green-600 font-medium flex items-center gap-2">
            <Check className="h-4 w-4" />
            {t("lessonCompleted")}
          </p>
        ) : null}

        {/* Previous and Next stay on screen at the foot of the lesson column, so moving on never
            means scrolling to the end first (principle 20: the footer sticks to the content
            column, not across the window). */}
        <nav
          aria-label={t("lessons")}
          className="sticky bottom-0 z-10 -mx-6 flex items-center justify-between gap-3 border-t border-border/60 bg-background/90 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75"
        >
          {lesson.prevLessonId ? (
            <Button
              variant="outline"
              onClick={() => lesson.prevLessonId && openLesson(lesson.prevLessonId)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("previousLesson")}
            </Button>
          ) : (
            <span />
          )}
          {lesson.nextLessonId ? (
            <Button
              onClick={() => lesson.nextLessonId && handleNext(lesson.nextLessonId)}
              className="gap-2"
            >
              {t("nextLesson")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}
        </nav>
      </div>
    </TermHoverProvider>
  );
}
