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
  const title = t("nis2Documents.meta.title");
  const description = t("nis2Documents.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-documents", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-documents",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

interface Row {
  readonly name: string;
  readonly plain: string;
  readonly law: string;
}

/** A document or a list, what it says in plain words, and the provision behind it. */
function DocTable({
  heading,
  lead,
  labels,
  rows,
}: {
  heading: string;
  lead: string;
  labels: { readonly name: string; readonly plain: string; readonly law: string };
  rows: readonly Row[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          {lead}
        </p>
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[32%]">{labels.name}</TableHead>
              <TableHead>{labels.plain}</TableHead>
              <TableHead className="hidden sm:table-cell">{labels.law}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="whitespace-normal align-top text-sm font-medium">
                  {row.name}
                  <span className="mt-1 block font-mono text-xs font-normal text-muted-foreground sm:hidden">
                    {row.law}
                  </span>
                </TableCell>
                <TableCell className="whitespace-normal align-top text-sm text-muted-foreground">
                  {row.plain}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap align-top font-mono text-xs text-muted-foreground sm:table-cell">
                  {row.law}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default async function Nis2DocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.nis2Documents"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const documents = (
    t.raw("documents.rows") as { document: string; plain: string; law: string }[]
  ).map(({ document, plain, law }) => ({ name: document, plain, law }));
  const lists = (
    t.raw("lists.rows") as { list: string; plain: string; law: string }[]
  ).map(({ list, plain, law }) => ({ name: list, plain, law }));

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="umsetzung"
          slug="nis2-documents"
          locale={locale}
          authorSlug="cory-hisey"
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
          art="/images/durchgang/4_4.svg"
        />

        <WikiPageMeta
          authorSlug="cory-hisey"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-10-05"
          sourceLocale="de"
        />

        <Separator />

        <WikiSection
          heading={t("duty.heading")}
          paragraphs={t.raw("duty.paragraphs") as string[]}
          law={t("duty.law")}
        />

        <DocTable
          heading={t("documents.heading")}
          lead={t("documents.lead")}
          labels={{
            name: t("documents.documentLabel"),
            plain: t("documents.plainLabel"),
            law: t("documents.lawLabel"),
          }}
          rows={documents}
        />

        <DocTable
          heading={t("lists.heading")}
          lead={t("lists.lead")}
          labels={{
            name: t("lists.listLabel"),
            plain: t("lists.plainLabel"),
            law: t("lists.lawLabel"),
          }}
          rows={lists}
        />

        <WikiSection
          heading={t("digital.heading")}
          paragraphs={t.raw("digital.paragraphs") as string[]}
          law={t("digital.law")}
        >
          <WikiMoreLink href="/wiki/grundlagen/cir-2024-2690">
            {t("digital.link")}
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
          shot={shotImage("approved", rawLocale, t("walk.seeItAlt"))}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps codes={["2.4", "3.1", "7.3"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
