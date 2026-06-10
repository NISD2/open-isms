import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { getTimelineData } from "@/lib/timeline";
import { NIS2Timeline } from "@/components/info/NIS2Timeline";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("nis2Timeline.meta.title");
  const description = t("nis2Timeline.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/zeit-und-status/nis2-timeline", locale),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-timeline",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

export default async function NIS2TimelinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const timeline = getTimelineData();

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="zeit-und-status"
        slug="nis2-timeline"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Compliance-Beauftragte"
        citationKeys={["nis2", "bsig", "cir-2024-2690"]}
        aboutKeys={["nis2"]}
      />
      <header>
        <Badge variant="secondary" className="mb-3">
          {t("nis2Timeline.badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("nis2Timeline.title")}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("nis2Timeline.subtitle")}
        </p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <NIS2Timeline
        events={timeline.events}
        sources={timeline.sources}
        lastUpdated={timeline.lastUpdated}
      />
    </div>
    </GlossedProse>
  );
}
