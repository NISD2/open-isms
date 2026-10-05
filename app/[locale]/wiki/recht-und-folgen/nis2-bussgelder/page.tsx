import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { shotImage } from "@/components/landing/shots";
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
  const title = t("penalties.meta.title");
  const description = t("penalties.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/recht-und-folgen/nis2-bussgelder", locale),
    ...pageOg({
      slug: "wiki/recht-und-folgen/nis2-bussgelder",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

interface FineRow {
  readonly what: string;
  readonly max: string;
  readonly law: string;
}

export default async function PenaltiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.penalties"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const rows = t.raw("amounts.rows") as FineRow[];

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="recht-und-folgen"
          slug="nis2-bussgelder"
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

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("amounts.heading")}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("amounts.lead")}
            </p>
          </div>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("amounts.whatLabel")}</TableHead>
                  <TableHead>{t("amounts.maxLabel")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("amounts.lawLabel")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.what}>
                    <TableCell className="whitespace-normal text-sm">
                      {row.what}
                      <span className="mt-1 block font-mono text-xs text-muted-foreground sm:hidden">
                        {row.law}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap align-top text-sm font-medium tabular-nums">
                      {row.max}
                    </TableCell>
                    <TableCell className="hidden align-top font-mono text-xs text-muted-foreground sm:table-cell">
                      {row.law}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">{t("amounts.note")}</p>
        </section>

        <WikiSection
          heading={t("turnover.heading")}
          paragraphs={t.raw("turnover.paragraphs") as string[]}
          law={t("turnover.law")}
        />

        <WikiSection
          heading={t("process.heading")}
          paragraphs={t.raw("process.paragraphs") as string[]}
          law={t("process.law")}
        />

        <WikiSection
          heading={t("management.heading")}
          paragraphs={t.raw("management.paragraphs") as string[]}
        >
          <WikiMoreLink href="/wiki/recht-und-folgen/geschaftsfuhrerhaftung">
            {t("management.link")}
          </WikiMoreLink>
        </WikiSection>

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
          shot={shotImage("approved", rawLocale, t("walk.seeItAlt"))}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps codes={["3.3", "12.2", "7.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
