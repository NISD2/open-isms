import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { shotImage } from "@/components/landing/shots";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const title = t("whatIsNis2.meta.title");
  const description = t("whatIsNis2.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/what-is-nis2", locale),
    ...pageOg({
      slug: "wiki/grundlagen/what-is-nis2",
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

interface SizeRow {
  readonly size: string;
  readonly test: string;
  readonly result: string;
}

function SectorList({ heading, items }: { heading: string; items: readonly string[] }) {
  return (
    <div className="space-y-2 rounded-xl border p-4">
      <h3 className="text-sm font-semibold">{heading}</h3>
      <ol className="space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 font-mono text-xs leading-5 text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="leading-5">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function WhatIsNis2Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.whatIsNis2"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const duties = t.raw("duties.items") as Duty[];
  const sizes = t.raw("size.rows") as SizeRow[];

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="grundlagen"
          slug="what-is-nis2"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche ohne Vorkenntnisse"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2"]}
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
          locale={locale}
          lastReviewedAt="2026-10-05"
          sourceLocale="de"
        />

        <Separator />

        <WikiSection
          heading={t("directive.heading")}
          paragraphs={t.raw("directive.paragraphs") as string[]}
          law={t("directive.law")}
        />

        <WikiSection
          heading={t("who.heading")}
          paragraphs={t.raw("who.paragraphs") as string[]}
          law={t("who.law")}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SectorList
              heading={t("who.annex1Heading")}
              items={t.raw("who.annex1") as string[]}
            />
            <SectorList
              heading={t("who.annex2Heading")}
              items={t.raw("who.annex2") as string[]}
            />
          </div>
        </WikiSection>

        <WikiSection heading={t("size.heading")} paragraphs={[t("size.lead")]}>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("size.sizeLabel")}</TableHead>
                  <TableHead>{t("size.testLabel")}</TableHead>
                  <TableHead>{t("size.resultLabel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sizes.map((row) => (
                  <TableRow key={row.size}>
                    <TableCell className="align-top font-medium">{row.size}</TableCell>
                    <TableCell className="whitespace-normal align-top text-sm">
                      {row.test}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top text-sm">
                      {row.result}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("size.note")}
          </p>
        </WikiSection>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">{t("duties.heading")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {duties.map((duty) => (
              <Card key={duty.title} className="gap-2 py-5">
                <CardContent className="space-y-2 px-5">
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
        </section>

        <WikiSection
          heading={t("penalties.heading")}
          paragraphs={t.raw("penalties.paragraphs") as string[]}
          law={t("penalties.law")}
        >
          <WikiMoreLink href="/wiki/recht-und-folgen/nis2-bussgelder">
            {t("penalties.link")}
          </WikiMoreLink>
        </WikiSection>

        <WikiSection
          heading={t("nis1.heading")}
          paragraphs={t.raw("nis1.paragraphs") as string[]}
          law={t("nis1.law")}
        />

        <WikiSection
          heading={t("national.heading")}
          paragraphs={t.raw("national.paragraphs") as string[]}
          law={t("national.law")}
        >
          <div className="flex flex-col gap-x-6 sm:flex-row">
            <WikiMoreLink href="/wiki/zeit-und-status/nis2-in-germany">
              {t("national.germanyLink")}
            </WikiMoreLink>
            <WikiMoreLink href="/wiki/zeit-und-status/nis2-umsetzung-europa">
              {t("national.europeLink")}
            </WikiMoreLink>
          </div>
        </WikiSection>

        <WikiSection
          heading={t("midsize.heading")}
          paragraphs={t.raw("midsize.paragraphs") as string[]}
          law={t("midsize.law")}
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
