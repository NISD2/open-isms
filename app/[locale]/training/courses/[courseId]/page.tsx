import { api } from "@/lib/trpc/server";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Check, Clock, PlayCircle, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default async function CourseOverviewRoute({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const locale = await getLocale();
  const { course, progress, lessonMetas } = await api.trainingPortal.getCourse({
    courseId,
  });

  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lessonId),
  );

  const totalLessons = course.modules.reduce(
    (n, m) => n + m.lessonIds.length,
    0,
  );
  const completedCount = completedSet.size;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const totalMinutes = Object.values(lessonMetas).reduce(
    (sum, m) => sum + m.estimatedMinutes,
    0,
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {course.title[locale] ?? course.title.en}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {course.description[locale] ?? course.description.en}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{totalLessons} lessons</span>
          <span className="text-border">|</span>
          <span>
            {totalHours > 0 ? `${totalHours}h ` : ""}
            {remainingMinutes}min
          </span>
          <span className="text-border">|</span>
          <span>{course.modules.length} modules</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {completedCount} of {totalLessons} lessons completed
          </span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {course.modules.map((mod, modIdx) => {
          const completedInMod = mod.lessonIds.filter((id) =>
            completedSet.has(id),
          ).length;
          const modComplete = completedInMod === mod.lessonIds.length;
          const modMinutes = mod.lessonIds.reduce(
            (sum, id) => sum + (lessonMetas[id]?.estimatedMinutes ?? 0),
            0,
          );

          return (
            <Collapsible key={mod.id} defaultOpen={modIdx === 0 || !modComplete}>
              <div className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {modComplete ? (
                      <div className="flex items-center justify-center size-6 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Check className="size-3.5 text-green-600" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">
                        {modIdx + 1}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-semibold text-sm">
                        {mod.title[locale] ?? mod.title.en}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {completedInMod}/{mod.lessonIds.length} lessons
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
                      const isCompleted = completedSet.has(lessonId);
                      const title = meta?.title?.[locale] ?? meta?.title?.en ?? lessonId;
                      const mins = meta?.estimatedMinutes ?? 0;

                      return (
                        <Link
                          key={lessonId}
                          href={{
                            pathname: "/training/courses/[courseId]/[lessonId]",
                            params: { courseId, lessonId },
                          }}
                          prefetch={false}
                          className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors group"
                        >
                          {isCompleted ? (
                            <div className="flex items-center justify-center size-7 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
                              <Check className="size-3.5 text-green-600" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center size-7 rounded-full border-2 border-muted-foreground/20 shrink-0 group-hover:border-primary/50 transition-colors">
                              <PlayCircle className="size-3.5 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                            </div>
                          )}
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
    </div>
  );
}
