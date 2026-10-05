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
  const title = t("nis2InGermany.meta.title");
  const description = t("nis2InGermany.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/zeit-und-status/nis2-in-germany", locale),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-in-germany",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

/** Each duty with the page that covers it, in the order of `duties.items`. */
const DUTY_PAGES = [
  "/wiki/troubleshooting/nis2-registrierung-verpasst",
  "/wiki/umsetzung/nis2-requirements",
  "/wiki/umsetzung/nis2-meldepflicht",
  "/wiki/recht-und-folgen/geschaftsfuhrerhaftung",
] as const;

interface Duty {
  readonly title: string;
  readonly text: string;
  readonly law: string;
}

interface Milestone {
  readonly date: string;
  readonly event: string;
}

export default async function Nis2InGermanyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.nis2InGermany"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const duties = t.raw("duties.items") as Duty[];
  const milestones = t.raw("timeline.items") as Milestone[];

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="zeit-und-status"
          slug="nis2-in-germany"
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
          art="/images/durchgang/12_3.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-10-05"
          sourceLocale="de"
        />

        <Separator />

        <WikiSection
          heading={t("law.heading")}
          paragraphs={t.raw("law.paragraphs") as string[]}
          law={t("law.law")}
        />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("timeline.heading")}
          </h2>
          <div className="divide-y rounded-xl border">
            {milestones.map(({ date, event }) => (
              <div
                key={date}
                className="grid gap-1 p-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
              >
                <p className="text-sm font-semibold">{date}</p>
                <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                  {event}
                </p>
              </div>
            ))}
          </div>
          <WikiMoreLink href="/wiki/zeit-und-status/nis2-timeline">
            {t("timeline.link")}
          </WikiMoreLink>
        </section>

        <WikiSection
          heading={t("who.heading")}
          paragraphs={t.raw("who.paragraphs") as string[]}
          law={t("who.law")}
        />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">{t("duties.heading")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {duties.map((duty, i) => (
              <Card key={duty.title} className="gap-2 py-5">
                <CardContent className="space-y-2 px-5">
                  <h3 className="text-base font-semibold">{duty.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {duty.text}
                  </p>
                  <p>
                    <span className={LAW_CHIP}>{duty.law}</span>
                  </p>
                  <WikiMoreLink
                    href={DUTY_PAGES[i] ?? "/wiki/umsetzung/nis2-requirements"}
                  >
                    {w("more")}
                  </WikiMoreLink>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <WikiSection
          heading={t("supervision.heading")}
          paragraphs={t.raw("supervision.paragraphs") as string[]}
          law={t("supervision.law")}
        >
          <WikiMoreLink href="/wiki/recht-und-folgen/nis2-bussgelder">
            {t("supervision.link")}
          </WikiMoreLink>
        </WikiSection>

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
          shot={shotImage("path", rawLocale, t("walk.seeItAlt"))}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps codes={["12.2", "3.3", "1.1"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
