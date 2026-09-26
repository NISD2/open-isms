import { BookOpen, CheckCircle2, ChevronRight, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/trpc/server";

const COURSES = [
  { id: "nis2-ceo", badge: "NIS 2" },
  { id: "nis2-tabletop", badge: "NIS 2" },
  { id: "cra-sbom", badge: "CRA" },
] as const;

/** Below this a count reads as "nobody takes this", so the line is left out. */
const MIN_PARTICIPANTS_SHOWN = 10;

export default async function CoursesRoute() {
  const t = await getTranslations("trainingPortal");
  const locale = await getLocale();

  const [courseData, participants] = await Promise.all([
    Promise.all(COURSES.map(({ id }) => api.trainingPortal.getCourse({ courseId: id }))),
    api.trainingPortal.participants({ courseIds: COURSES.map(({ id }) => id) }),
  ]);

  return (
    <div className="px-6 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("courses")}</p>
      </div>

      <div className="grid gap-4">
        {courseData.map(({ course, progress }, i) => {
          const badge = COURSES[i].badge;
          const totalLessons = course.modules.reduce((n, m) => n + m.lessonIds.length, 0);
          const completedCount = progress.filter((p) => p.completed).length;
          const hasStarted = progress.length > 0;
          const isFinished = completedCount === totalLessons && totalLessons > 0;
          const pct = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
          const people = participants[course.id] ?? 0;

          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base leading-snug">
                        {course.title[locale] ?? course.title.en}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {badge}
                      </Badge>
                      {isFinished && (
                        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description[locale] ?? course.description.en}
                    </CardDescription>
                    {people >= MIN_PARTICIPANTS_SHOWN ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        {t("participants", { count: people })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t("progressLabel", {
                        completed: completedCount,
                        total: totalLessons,
                      })}
                    </p>
                    <div className="w-full max-w-48 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={{
                      pathname: "/training/courses/[courseId]",
                      params: { courseId: course.id },
                    }}
                  >
                    <Button
                      variant={hasStarted ? "default" : "outline"}
                      className="gap-2 shrink-0"
                    >
                      {hasStarted ? t("continueCourse") : t("startCourse")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
