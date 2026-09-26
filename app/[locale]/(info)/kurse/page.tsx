import { ArrowRight, BookOpen, Clock, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingHero } from "@/components/marketing/MarketingHero";
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
import { db } from "@/lib/db";
import { pageAlternates } from "@/lib/seo";
import { COURSES, MIN_PARTICIPANTS_SHOWN } from "@/lib/training/catalog";
import { courseTotals, loadCourse } from "@/lib/training/course-loader";
import { courseParticipants } from "@/lib/training/participants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("trainingPortal.publicOverview");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("kurse", locale),
  };
}

/**
 * The public course overview: every course, how long it is and how many people started it, each
 * linking to its own public page. The logged-in overview with personal progress stays at
 * /training/courses, and /training itself is the portal's training records page, which is why
 * this one lives at /kurse. A public page must not fail on the database, so a failed count shows
 * none.
 */
export default async function PublicCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("trainingPortal.publicOverview");
  const tp = await getTranslations("trainingPortal");

  const [courses, participants] = await Promise.all([
    Promise.all(
      COURSES.map(async (entry) => ({
        ...entry,
        course: await loadCourse(entry.id),
        totals: await courseTotals(entry.id),
      })),
    ),
    courseParticipants(
      db,
      COURSES.map(({ id }) => id),
    ).catch(() => ({}) as Readonly<Record<string, number>>),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <MarketingHero centered headline={t("title")} subhead={t("subtitle")} />
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {courses.map(({ id, badge, landing, course, totals }) => {
          const people = participants[id] ?? 0;
          return (
            <Card key={id} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <BookOpen className="size-5" />
                  </span>
                  <Badge variant="secondary">{badge}</Badge>
                </div>
                <CardTitle className="text-lg leading-snug">
                  {course.title[locale] ?? course.title.en}
                </CardTitle>
                <CardDescription className="line-clamp-4">
                  {course.description[locale] ?? course.description.en}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Clock className="size-4" />
                    {t("length", { lessons: totals.lessons, minutes: totals.minutes })}
                  </p>
                  {people >= MIN_PARTICIPANTS_SHOWN ? (
                    <p className="flex items-center gap-2">
                      <Users className="size-4" />
                      {tp("participants", { count: people })}
                    </p>
                  ) : null}
                </div>
                <Button asChild className="w-full">
                  <Link href={landing}>
                    {t("cta")}
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
