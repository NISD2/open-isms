import type { Metadata } from "next";
import { pageAlternates, pageOg } from "@/lib/seo";
import { PitchDeckViewer } from "@/components/pitch/PitchDeckViewer";
import { db } from "@/lib/db";
import { trainingLessonProgress } from "@nisd2/isms-schema/tables/training-progress";
import { user } from "@nisd2/isms-schema/tables/organization";
import { eq, countDistinct, count, and, sql } from "drizzle-orm";

async function getPitchStats() {
  try {
    const [usersResult, startsResult, completionsResult] = await Promise.all([
      // Total registered users
      db.select({ count: count(user.id) }).from(user),
      // Distinct users who started the CEO course (have any lesson progress row)
      db
        .select({ count: countDistinct(trainingLessonProgress.userId) })
        .from(trainingLessonProgress)
        .where(eq(trainingLessonProgress.courseId, "nis2-ceo")),
      // Users who completed all 47 lessons
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const title = isEn
    ? "Investor Pitch Deck | nisd2.eu"
    : "Investorenpräsentation | nisd2.eu";
  const description = isEn
    ? "nisd2.eu company overview — business model, market, traction, team, and financials for the free open-source NIS2 compliance platform."
    : "nisd2.eu Unternehmensübersicht — Geschäftsmodell, Markt, Traktion, Team und Finanzen der kostenlosen Open-Source-NIS2-Compliance-Plattform.";
  return {
    title,
    description,
    alternates: pageAlternates("pitch", locale),
    ...pageOg({ slug: "pitch", locale, title, description }),
  };
}

export default async function PitchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  const resolvedLocale = isEn ? "en" : "de";
  const stats = await getPitchStats();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isEn ? "Transparency" : "Transparenz"}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEn ? "Pitch Deck" : "Investorenpräsentation"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEn
            ? "Our full business overview — market, model, traction, team, and financials. Use ← → arrow keys to navigate."
            : "Unsere vollständige Unternehmensübersicht — Markt, Modell, Traktion, Team und Finanzen. Mit ← → Pfeiltasten navigieren."}
        </p>
      </header>

      <PitchDeckViewer locale={resolvedLocale} stats={stats} />
    </div>
  );
}
