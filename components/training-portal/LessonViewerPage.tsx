"use client";

import { BookOpen, Check, ChevronLeft, ChevronRight, Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Art } from "@/components/durchgang/Art";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";
import type { Lesson } from "@/lib/training/schemas";
import { DictionarySidebar } from "./DictionarySidebar";
import { JourneyLink } from "./JourneyLink";
import { QuizForm } from "./QuizForm";
import { TermHoverProvider, useTermHover } from "./TermHoverContext";

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
  /** The lesson's picture (lib/training/art.ts), or null where none is drawn. */
  image: string | null;
  /** NIS2 journey category this lesson maps to, or null (gated server-side). */
  journeyCategory: string | null;
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
  image,
  journeyCategory,
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

  return (
    <TermHoverProvider>
      <div className="space-y-8">
        {/* Content + Dictionary layout: the rail starts level with the lesson's picture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Content (2/3) */}
          <div className="lg:col-span-2">
            {image && (
              <div className="mb-8 flex h-44 items-end justify-center overflow-hidden rounded-3xl bg-primary/[0.06] sm:h-52">
                <Art src={image} className="h-40 translate-y-2 sm:h-48" />
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-1">
              {t("lesson")} {lesson.id} ·{" "}
              {t("estimatedTime", { minutes: lesson.estimatedMinutes })}
            </p>
            <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              {lesson.title[locale] ?? lesson.title.en}
            </h1>
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
            {journeyCategory ? (
              <JourneyLink category={journeyCategory} locale={locale} />
            ) : null}
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
          <Button onClick={handleComplete} size="lg" className="gap-2">
            <Check className="h-4 w-4" />
            {t("completeLesson")}
          </Button>
        ) : completed ? (
          <p className="text-sm text-green-600 font-medium flex items-center gap-2">
            <Check className="h-4 w-4" />
            {t("lessonCompleted")}
          </p>
        ) : null}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          {(() => {
            const prevId = lesson.prevLessonId;
            if (!prevId) return <div />;
            return (
              <Button
                variant="outline"
                onClick={() =>
                  router.push({
                    pathname: "/training/courses/[courseId]/[lessonId]",
                    params: { courseId, lessonId: prevId },
                  })
                }
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("previousLesson")}
              </Button>
            );
          })()}

          {(() => {
            const nextId = lesson.nextLessonId;
            if (!nextId) return null;
            return (
              <Button
                onClick={() =>
                  router.push({
                    pathname: "/training/courses/[courseId]/[lessonId]",
                    params: { courseId, lessonId: nextId },
                  })
                }
                className="gap-2"
              >
                {t("nextLesson")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            );
          })()}
        </div>
      </div>
    </TermHoverProvider>
  );
}
