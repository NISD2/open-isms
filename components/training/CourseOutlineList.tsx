import { Link } from "@/i18n/navigation";
import { Clock, PlayCircle, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { loadCourse, loadLesson } from "@/lib/training/course-loader";

type Locale = string;

export async function CourseOutlineList({
  courseId,
  locale,
  lessonsLabel,
}: {
  courseId: string;
  locale: Locale;
  lessonsLabel: string;
}) {
  const course = await loadCourse(courseId);
  const allLessonIds = course.modules.flatMap((m) => m.lessonIds);
  const lessonMetas: Record<
    string,
    { title: Record<string, string>; estimatedMinutes: number }
  > = {};
  await Promise.all(
    allLessonIds.map(async (id) => {
      const lesson = await loadLesson(course.id, id);
      lessonMetas[id] = {
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
      };
    }),
  );

  return (
    <div className="space-y-3">
      {course.modules.map((mod, modIdx) => {
        const modMinutes = mod.lessonIds.reduce(
          (sum, id) => sum + (lessonMetas[id]?.estimatedMinutes ?? 0),
          0,
        );

        return (
          <Collapsible key={mod.id} defaultOpen={modIdx === 0}>
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
              <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm ring-1 ring-primary/20">
                    {modIdx + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">
                      {mod.title[locale] ?? mod.title.en}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {mod.lessonIds.length} {lessonsLabel}
                      <span className="mx-1.5 text-border">|</span>
                      {modMinutes} min
                    </div>
                  </div>
                </div>
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t divide-y">
                  {mod.lessonIds.map((lessonId) => {
                    const meta = lessonMetas[lessonId];
                    const title =
                      meta?.title?.[locale] ?? meta?.title?.en ?? lessonId;
                    const mins = meta?.estimatedMinutes ?? 0;

                    return (
                      <Link
                        key={lessonId}
                        href={{
                          pathname: "/training/courses/[courseId]/[lessonId]",
                          params: { courseId: course.id, lessonId },
                        }}
                        prefetch={false}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-muted/60 transition-colors group"
                      >
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 ring-1 ring-primary/20 shrink-0 transition-colors">
                          <PlayCircle className="size-4 text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {title}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                          <Clock className="size-3" />
                          {mins} min
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
