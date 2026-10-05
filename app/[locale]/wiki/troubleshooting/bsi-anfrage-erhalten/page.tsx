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
  const title = t("bsiAnfrageErhalten.meta.title");
  const description = t("bsiAnfrageErhalten.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/troubleshooting/bsi-anfrage-erhalten", locale),
    ...pageOg({
      slug: "wiki/troubleshooting/bsi-anfrage-erhalten",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

interface Basis {
  readonly title: string;
  readonly text: string;
  readonly law: string;
}

export default async function BsiAnfrageErhaltenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.bsiAnfrageErhalten"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const bases = t.raw("bases.items") as Basis[];
  const steps = t.raw("steps.items") as string[];

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="troubleshooting"
          slug="bsi-anfrage-erhalten"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["bsig"]}
          mentionsKeys={["nis2"]}
        />
        <JsonLd data={faqJsonLd(faq)} />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle")}
          art="/images/durchgang/7_3.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-10-05"
          sourceLocale="de"
        />

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t("bases.heading")}</h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("bases.lead")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {bases.map((basis) => (
              <Card key={basis.title} className="gap-2 py-5">
                <CardContent className="space-y-2 px-5">
                  <h3 className="text-base font-semibold">{basis.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {basis.text}
                  </p>
                  <p>
                    <span className={LAW_CHIP}>{basis.law}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">{t("steps.heading")}</h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="max-w-[62ch] pt-0.5 text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <WikiSection
          heading={t("limits.heading")}
          paragraphs={t.raw("limits.paragraphs") as string[]}
          law={t("limits.law")}
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
          shot={shotImage("export", rawLocale, t("walk.seeItAlt"))}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps codes={["12.2", "7.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
