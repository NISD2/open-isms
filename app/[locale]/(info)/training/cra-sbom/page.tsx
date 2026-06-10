import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Shield,
  ArrowRight,
  User,
} from "lucide-react";
import { loadCourse } from "@/lib/training/course-loader";
import { CourseOutlineList } from "@/components/training/CourseOutlineList";
import { pageAlternates } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { db } from "@/lib/db";
import { trainingLessonProgress } from "@/schema";
import { eq, countDistinct } from "drizzle-orm";

let cachedCount: { value: number; expiresAt: number } | null = null;

async function getLearnerCount(): Promise<number> {
  if (cachedCount && Date.now() < cachedCount.expiresAt) return cachedCount.value;
  try {
    const [result] = await db
      .select({ count: countDistinct(trainingLessonProgress.userId) })
      .from(trainingLessonProgress)
      .where(eq(trainingLessonProgress.courseId, "cra-sbom"));
    const count = result?.count ?? 0;
    cachedCount = { value: count, expiresAt: Date.now() + 10 * 60 * 1000 };
    return count;
  } catch {
    return 0;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("trainingCraSbom.meta.title"),
    description: t("trainingCraSbom.meta.description"),
    alternates: pageAlternates("training/cra-sbom", locale),
    openGraph: {
      title: t("trainingCraSbom.meta.ogTitle"),
      description: t("trainingCraSbom.meta.ogDescription"),
      type: "website",
    },
  };
}

const highlightIcons = [BookOpen, Clock, Shield, GraduationCap] as const;
const highlightKeys = ["lessons", "hours", "quizzes", "certificate"] as const;

export default async function CraSbomTrainingLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("info");
  const [course, learnerCount] = await Promise.all([
    loadCourse("cra-sbom"),
    getLearnerCount(),
  ]);

  return (
    <div className="space-y-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: t("trainingCraSbom.title"),
          description: t("trainingCraSbom.meta.description"),
          provider: {
            "@type": "Organization",
            name: "NISD2.eu",
            url: "https://www.nisd2.eu",
          },
          isAccessibleForFree: true,
          numberOfLessons: 9,
          timeRequired: "PT60M",
          educationalLevel: "Professional",
          inLanguage: ["en", "de"],
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: "PT50M",
          },
        }}
      />

      {/* Hero */}
      <header className="space-y-4">
        <Badge variant="secondary">{t("trainingCraSbom.badge")}</Badge>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          {t("trainingCraSbom.title")}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          {t("trainingCraSbom.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={{ pathname: "/training/courses/[courseId]/[lessonId]", params: { courseId: "cra-sbom", lessonId: "0.1" } }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {t("trainingCraSbom.startCourse")}
            <ArrowRight className="size-4" />
          </Link>
          {learnerCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 w-fit">
              <div className="flex -space-x-1.5">
                <div className="size-5 rounded-full bg-blue-500/20 border-2 border-background flex items-center justify-center">
                  <User className="size-2.5 text-blue-700 dark:text-blue-300" />
                </div>
                <div className="size-5 rounded-full bg-emerald-500/20 border-2 border-background flex items-center justify-center">
                  <User className="size-2.5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="size-5 rounded-full bg-amber-500/20 border-2 border-background flex items-center justify-center">
                  <User className="size-2.5 text-amber-700 dark:text-amber-300" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {t("trainingCraSbom.learnerCount", { count: learnerCount })}
              </span>
            </div>
          )}
        </div>
      </header>

      <Separator />

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {highlightKeys.map((key, i) => {
          const Icon = highlightIcons[i];
          return (
            <div key={key} className="flex gap-4">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-semibold">{t(`trainingCraSbom.highlights.${key}.title`)}</div>
                <div className="text-sm text-muted-foreground">
                  {t(`trainingCraSbom.highlights.${key}.description`)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Who is this for */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">{t("trainingCraSbom.whoFor.heading")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("trainingCraSbom.whoFor.body")}
        </p>
      </section>

      {/* What you will learn — full collapsible outline */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{t("trainingCraSbom.whatLearn.heading")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("trainingCraSbom.whatLearn.body", { moduleCount: course.modules.length })}
        </p>
        <CourseOutlineList
          courseId="cra-sbom"
          locale={locale}
          lessonsLabel={t("trainingCraSbom.lessonsLabel")}
        />
      </section>

      <Separator />

      {/* Why free */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">{t("trainingCraSbom.whyFree.heading")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("trainingCraSbom.whyFree.body")}
        </p>
      </section>

      {/* CTA */}
      <div className="rounded-lg border bg-muted/30 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">
          {t("trainingCraSbom.cta.heading")}
        </h2>
        <p className="text-muted-foreground">
          {t("trainingCraSbom.cta.body")}
        </p>
        <Link
          href={{ pathname: "/training/courses/[courseId]/[lessonId]", params: { courseId: "cra-sbom", lessonId: "0.1" } }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          {t("trainingCraSbom.cta.button")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
