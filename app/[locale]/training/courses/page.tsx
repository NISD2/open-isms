import { CheckCircle2, ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Art } from "@/components/durchgang/Art";
import { LearnerCountBadge } from "@/components/training/LearnerCountBadge";
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
import { courseArt } from "@/lib/training/art";
import { COURSES, MIN_PARTICIPANTS_SHOWN } from "@/lib/training/catalog";
import { api } from "@/lib/trpc/server";

export default async function CoursesRoute() {
  const t = await getTranslations("trainingPortal");
  const locale = await getLocale();

  const [courseData, participants] = await Promise.all([
    Promise.all(COURSES.map(({ id }) => api.trainingPortal.getCourse({ courseId: id }))),
    api.trainingPortal.participants({ courseIds: COURSES.map(({ id }) => id) }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("courses")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courseData.map(({ course, progress }, i) => {
          const badge = COURSES[i].badge;
          const totalLessons = course.modules.reduce((n, m) => n + m.lessonIds.length, 0);
          const completedCount = progress.filter((p) => p.completed).length;
          const hasStarted = progress.length > 0;
          const isFinished = completedCount === totalLessons && totalLessons > 0;
          const pct = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
          const people = participants[course.id] ?? 0;
          const image = courseArt(course.id);

          return (
            // The card's one link is the button; it stretches over the card, so the whole card opens
            // the course (ui-design principle 14).
            <Card
              key={course.id}
              className="relative overflow-hidden pt-0 transition-colors hover:bg-muted/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
            >
              {image ? (
                <div className="flex h-44 items-end justify-center bg-primary/[0.06]">
                  <Art src={image} className="h-40 translate-y-2" />
                </div>
              ) : null}
              <CardHeader className={image ? undefined : "pt-6"}>
                {people >= MIN_PARTICIPANTS_SHOWN ? (
                  <div className="mb-1">
                    <LearnerCountBadge>
                      {t("participants", { count: people })}
                    </LearnerCountBadge>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg leading-snug">
                    {course.title[locale] ?? course.title.en}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {badge}
                  </Badge>
                  {isFinished && (
                    <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                  )}
                </div>
                <CardDescription className="line-clamp-3">
                  {course.description[locale] ?? course.description.en}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">
                      {t("progressLabel", {
                        completed: completedCount,
                        total: totalLessons,
                      })}
                    </p>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
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
                    className="block after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    <Button
                      variant={hasStarted ? "default" : "outline"}
                      className="w-full gap-2"
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
