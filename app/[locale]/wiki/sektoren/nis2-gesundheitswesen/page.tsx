import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { itemShot } from "@/components/durchgang/itemShots";
import { JsonLd } from "@/components/JsonLd";
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
  const title = t("sectorHealth.meta.title");
  const description = t("sectorHealth.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/sektoren/nis2-gesundheitswesen", locale),
    ...pageOg({
      slug: "wiki/sektoren/nis2-gesundheitswesen",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

/** The walk's asset step, whose screen shows the business processes, ticked. */
const ASSET_STEP = "2.2";

interface Row {
  readonly who: string;
  readonly where: string;
}

export default async function SectorHealthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.sectorHealth"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const rows = t.raw("who.rows") as Row[];
  const shot = itemShot(ASSET_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${ASSET_STEP}`);

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="sektoren"
          slug="nis2-gesundheitswesen"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung im Gesundheitswesen und in der Medizintechnik"
          citationKeys={["nis2", "bsig", "gdpr"]}
          aboutKeys={["nis2"]}
        />
        <JsonLd data={faqJsonLd(faq)} />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle")}
          art="/images/durchgang/3_1.svg"
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
          paragraphs={[t("who.lead")]}
          law={t("who.law")}
        >
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("who.whoLabel")}</TableHead>
                  <TableHead>{t("who.whereLabel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.where}>
                    <TableCell className="whitespace-normal text-sm">{row.who}</TableCell>
                    <TableCell className="align-top font-mono text-xs text-muted-foreground">
                      {row.where}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {(t.raw("who.paragraphs") as string[]).map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
        </WikiSection>

        <WikiSection
          heading={t("medtech.heading")}
          paragraphs={t.raw("medtech.paragraphs") as string[]}
          law={t("medtech.law")}
        />

        <WikiSection
          heading={t("special.heading")}
          paragraphs={t.raw("special.paragraphs") as string[]}
          law={t("special.law")}
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
          shot={shot}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps codes={["2.2", "3.1"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
