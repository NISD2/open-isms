import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { itemShot } from "@/components/durchgang/itemShots";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
import { WikiMoreLink } from "@/components/wiki/WikiMoreLink";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import {
  faqJsonLd,
  LAW_CHIP,
  WikiExample,
  WikiFaq,
  type WikiQuestion,
  WikiSection,
  WikiSources,
} from "@/components/wiki/WikiSection";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("bsigParagraph32.meta.title");
  const description = t("bsigParagraph32.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/bsig-32", locale),
    ...pageOg({
      slug: "wiki/grundlagen/bsig-32",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

/** The walk's reporting step, whose screen shows the three deadlines. */
const REPORTING_STEP = "3.3";

interface Stage {
  readonly deadline: string;
  readonly title: string;
  readonly text: string;
  readonly law: string;
}

export default async function BsigParagraph32Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.bsigParagraph32"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const stages = t.raw("stages.items") as Stage[];
  const shot = itemShot(REPORTING_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${REPORTING_STEP}`);

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="grundlagen"
          slug="bsig-32"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2", "bsig", "cir-2024-2690", "gdpr"]}
          aboutKeys={["bsig"]}
          mentionsKeys={["nis2"]}
        />
        <JsonLd data={faqJsonLd(faq)} />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle")}
          art="/images/durchgang/3_3.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale}
          lastReviewedAt="2026-10-05"
          sourceLocale="de"
        />

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("stages.heading")}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("stages.lead")}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {stages.map((stage) => (
              <div key={stage.title} className="space-y-2 rounded-xl border p-4">
                <Badge variant="outline">{stage.deadline}</Badge>
                <h3 className="text-sm font-semibold">{stage.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {stage.text}
                </p>
                <p>
                  <span className={LAW_CHIP}>{stage.law}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("stages.between")}
          </p>
          <WikiMoreLink href="/wiki/umsetzung/nis2-meldepflicht">
            {t("stages.link")}
          </WikiMoreLink>
        </section>

        <WikiSection
          heading={t("significant.heading")}
          paragraphs={t.raw("significant.paragraphs") as string[]}
          law={t("significant.law")}
        />

        <WikiSection
          heading={t("clock.heading")}
          paragraphs={t.raw("clock.paragraphs") as string[]}
          law={t("clock.law")}
        />

        <WikiSection
          heading={t("paragraphs.heading")}
          paragraphs={t.raw("paragraphs.items") as string[]}
        />

        <WikiSection
          heading={t("size.heading")}
          paragraphs={t.raw("size.paragraphs") as string[]}
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
          shot={shot}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps codes={["3.1", "3.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
