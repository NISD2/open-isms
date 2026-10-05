import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { itemShot } from "@/components/durchgang/itemShots";
import { JsonLd } from "@/components/JsonLd";
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
  const title = t("bsigParagraph38.meta.title");
  const description = t("bsigParagraph38.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/bsig-38", locale),
    ...pageOg({
      slug: "wiki/grundlagen/bsig-38",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

/** The walk's step for management training, whose screen shows one line per manager. */
const TRAINING_STEP = "1.1";

interface Subsection {
  readonly label: string;
  readonly quote: string;
  readonly plain: string;
}

export default async function BsigParagraph38Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.bsigParagraph38"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const subsections = t.raw("text.items") as Subsection[];
  const shot = itemShot(TRAINING_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${TRAINING_STEP}`);

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="grundlagen"
          slug="bsig-38"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und Vorstand im Mittelstand"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["bsig"]}
          mentionsKeys={["nis2"]}
        />
        <JsonLd data={faqJsonLd(faq)} />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle")}
          art="/images/durchgang/1_1.svg"
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
            <h2 className="text-xl font-semibold tracking-tight">{t("text.heading")}</h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("text.lead")}
            </p>
          </div>
          <div className="space-y-3">
            {subsections.map(({ label, quote, plain }) => (
              <div key={label} className="space-y-2.5 rounded-xl border p-4">
                <h3 className="text-sm font-semibold">{label}</h3>
                <blockquote
                  lang="de"
                  className="max-w-[62ch] border-l-2 border-primary/30 pl-3 text-sm italic leading-relaxed text-muted-foreground"
                >
                  {quote}
                </blockquote>
                <p className="max-w-[62ch] text-sm leading-relaxed">
                  <span className="font-medium">{t("text.plainLabel")}:</span> {plain}
                </p>
              </div>
            ))}
          </div>
        </section>

        <WikiSection
          heading={t("training.heading")}
          paragraphs={t.raw("training.paragraphs") as string[]}
          law={t("training.law")}
        />

        <WikiSection
          heading={t("implement.heading")}
          paragraphs={t.raw("implement.paragraphs") as string[]}
          law={t("implement.law")}
        />

        <WikiSection
          heading={t("who.heading")}
          paragraphs={t.raw("who.paragraphs") as string[]}
          law={t("who.law")}
        >
          <WikiMoreLink href="/wiki/recht-und-folgen/geschaftsfuhrerhaftung">
            {t("who.link")}
          </WikiMoreLink>
        </WikiSection>

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

        <WalkSteps codes={["1.1", "7.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
