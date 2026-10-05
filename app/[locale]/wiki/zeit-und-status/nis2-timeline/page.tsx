import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NIS2Timeline } from "@/components/info/NIS2Timeline";
import { JsonLd } from "@/components/JsonLd";
import { shotImage } from "@/components/landing/shots";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
import { type WikiDate, WikiDates } from "@/components/wiki/WikiDates";
import { WikiMoreLink } from "@/components/wiki/WikiMoreLink";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import {
  faqJsonLd,
  WikiExample,
  WikiFaq,
  type WikiQuestion,
  WikiSection,
  WikiSources,
} from "@/components/wiki/WikiSection";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";
import { getTimelineData } from "@/lib/timeline";

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

export default async function NIS2TimelinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.nis2Timeline"),
    getTranslations("info.wikiWalk"),
  ]);
  const timeline = getTimelineData();
  const faq = t.raw("faq.items") as WikiQuestion[];

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="zeit-und-status"
          slug="nis2-timeline"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2", "bsig", "cir-2024-2690"]}
          aboutKeys={["nis2"]}
        />
        <JsonLd data={faqJsonLd(faq)} />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle")}
          art="/images/durchgang/12_3.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-10-05"
          sourceLocale="de"
        />

        <Separator />

        <WikiDates
          heading={t("company.heading")}
          lead={t("company.lead")}
          items={t.raw("company.items") as WikiDate[]}
        />

        <WikiDates
          heading={t("eu.heading")}
          lead={t("eu.lead")}
          items={t.raw("eu.items") as WikiDate[]}
        >
          <WikiMoreLink href="/wiki/zeit-und-status/nis2-umsetzung-europa">
            {t("eu.link")}
          </WikiMoreLink>
        </WikiDates>

        <WikiSection
          heading={t("size.heading")}
          paragraphs={t.raw("size.paragraphs") as string[]}
          law={t("size.law")}
        />

        <WikiExample
          heading={t("example.heading")}
          lead={t("example.lead")}
          items={t.raw("example.items") as string[]}
        />

        <WalkHow
          heading={t("walk.heading")}
          lead={t("walk.lead")}
          points={t.raw("walk.points") as string[]}
          shot={shotImage("ongoing", rawLocale, t("walk.seeItAlt"))}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSection heading={t("news.heading")} paragraphs={[t("news.lead")]}>
          <NIS2Timeline
            events={timeline.events}
            sources={timeline.sources}
            lastUpdated={timeline.lastUpdated}
          />
        </WikiSection>

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
