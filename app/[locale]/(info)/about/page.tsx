import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  pageAlternates,
  pageOg,
  buildAboutPageJsonLd,
  type Locale,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Globe } from "lucide-react";
import { PitchDeckViewer } from "@/components/pitch/PitchDeckViewer";
import { db } from "@/lib/db";
import { trainingLessonProgress } from "@nisd2/isms-schema/tables/training-progress";
import { user } from "@nisd2/isms-schema/tables/organization";
import { eq, countDistinct, count, and, sql } from "drizzle-orm";

/**
 * Live platform stats for the pitch deck. Falls back to a sane baseline if
 * the DB is unreachable (e.g. local dev without postgres). Same query shape
 * the dedicated /pitch page used before the consolidation; the route now
 * redirects here.
 */
async function getPitchStats() {
  try {
    const [usersResult, startsResult, completionsResult] = await Promise.all([
      db.select({ count: count(user.id) }).from(user),
      db
        .select({ count: countDistinct(trainingLessonProgress.userId) })
        .from(trainingLessonProgress)
        .where(eq(trainingLessonProgress.courseId, "nis2-ceo")),
      db
        .select({ userId: trainingLessonProgress.userId })
        .from(trainingLessonProgress)
        .where(
          and(
            eq(trainingLessonProgress.courseId, "nis2-ceo"),
            eq(trainingLessonProgress.completed, true),
          ),
        )
        .groupBy(trainingLessonProgress.userId)
        .having(sql`count(*) >= 47`),
    ]);
    return {
      users: usersResult[0]?.count ?? 0,
      courseStarts: startsResult[0]?.count ?? 0,
      courseCompletions: completionsResult.length,
    };
  } catch {
    return { users: 158, courseStarts: 76, courseCompletions: 0 };
  }
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("teamPage.meta.title");
  const description = t("teamPage.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("about", locale),
    ...pageOg({ slug: "about", locale, title, description, type: "website" }),
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const pitchLocale: "en" | "de" = locale === "en" ? "en" : "de";
  const t = await getTranslations("info");
  const stats = await getPitchStats();

  return (
    <div className="space-y-10">
      <JsonLd
        data={buildAboutPageJsonLd({
          slug: "about",
          locale,
          name: t("teamPage.meta.title"),
          description: t("teamPage.meta.description"),
        })}
      />
      <header>
        <Badge variant="secondary" className="mb-3">
          {t("teamPage.badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("teamPage.title")}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("teamPage.subtitle")}
        </p>
      </header>

      <Separator />

      {/* Pitch deck — full business overview. Migrated here from /pitch. */}
      <section className="space-y-3">
        <PitchDeckViewer locale={pitchLocale} stats={stats} />
      </section>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Simon */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <Image
                src="/simon-bg-rem.png"
                alt="Simon Orzel"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-semibold">Simon Orzel</p>
                <p className="text-sm text-muted-foreground">
                  CEO / Technical Co-Founder
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("teamPage.simon")}
            </p>
            <div className="flex gap-2">
              <a
                href="https://sorzel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="size-4" />
              </a>
              <a
                href="https://github.com/simonorzel26"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GithubIcon className="size-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/simon-orzel-5a974b180/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LinkedinIcon className="size-4" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Cory */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <Image
                src="/team-cory.png"
                alt="Cory Hisey"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-semibold">Cory Hisey</p>
                <p className="text-sm text-muted-foreground">
                  COO / Co-Founder
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("teamPage.cory")}
            </p>
            <div className="flex gap-2">
              <a
                href="https://github.com/CoryHisey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GithubIcon className="size-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/cory-hisey/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LinkedinIcon className="size-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Why us */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("teamPage.whyUs.heading")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("teamPage.whyUs.body")}
        </p>
      </section>

      <Separator />

      {/* Mission — slim version of the old /mission page. Three paragraphs:
          the problem, the cut, the model. The full breakdown / savings /
          tactics cards were dropped: they belong in the business plan, not
          a public about page. */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("mission.badge")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("mission.subtitle")}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("mission.problem.p1")}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("mission.plan.p1")}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            {t("mission.paid.heading")}.
          </span>{" "}
          {t("mission.paid.p1")}
        </p>
      </section>

      {/* CTA */}
      <Card>
        <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/applicability">{t("teamPage.ctaPlatform")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
