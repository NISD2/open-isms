import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { shotImage } from "@/components/landing/shots";
import { Card, CardContent } from "@/components/ui/card";
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
  const title = t("ceoLiability.meta.title");
  const description = t("ceoLiability.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/recht-und-folgen/geschaftsfuhrerhaftung", locale),
    ...pageOg({
      slug: "wiki/recht-und-folgen/geschaftsfuhrerhaftung",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

interface Duty {
  readonly title: string;
  readonly text: string;
  readonly law: string;
}

export default async function CeoLiabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.ceoLiability"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const duties = t.raw("duties.items") as Duty[];

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="recht-und-folgen"
          slug="geschaftsfuhrerhaftung"
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
          art="/images/durchgang/2_1.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-10-05"
          sourceLocale="de"
        />

        <Separator />

        <WikiSection
          heading={t("who.heading")}
          paragraphs={t.raw("who.paragraphs") as string[]}
          law={t("who.law")}
        />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("duties.heading")}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("duties.lead")}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {duties.map((duty, i) => (
              <Card key={duty.title} className="gap-2 py-5">
                <CardContent className="space-y-2 px-5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-semibold">{duty.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {duty.text}
                  </p>
                  <p>
                    <span className={LAW_CHIP}>{duty.law}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("duties.directive")}
          </p>
        </section>

        <WikiSection
          heading={t("liability.heading")}
          paragraphs={t.raw("liability.paragraphs") as string[]}
          law={t("liability.law")}
        />

        <WikiSection
          heading={t("authority.heading")}
          paragraphs={t.raw("authority.paragraphs") as string[]}
          law={t("authority.law")}
        >
          <WikiMoreLink href="/wiki/recht-und-folgen/nis2-bussgelder">
            {t("authority.link")}
          </WikiMoreLink>
        </WikiSection>

        <WikiSection
          heading={t("delegate.heading")}
          paragraphs={t.raw("delegate.paragraphs") as string[]}
        />

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
          shot={shotImage("approved", rawLocale, t("walk.seeItAlt"))}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps codes={["1.1", "7.3", "2.4"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
