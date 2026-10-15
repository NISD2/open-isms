import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GrcComparisonPage } from "@/components/grc-comparison/GrcComparisonPage";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import grcVendorsRaw from "@/data/grc-vendors.json";
import { wikiLocale } from "@/lib/content/wiki-locale";
import { localiseDataset } from "@/lib/grc-vendors/localize";
import {
  loadVendorDataset,
  summarise,
  type VendorDataset,
} from "@/lib/grc-vendors/schema";
import { pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("grcComparison");
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/vergleich/grc-vergleich", locale),
    ...pageOg({
      slug: "wiki/vergleich/grc-vergleich",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

export default async function GrcVergleichRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = wikiLocale(rawLocale);
  const fullDataset = loadVendorDataset(grcVendorsRaw);
  const dataset: VendorDataset = {
    ...fullDataset,
    vendors: fullDataset.vendors.filter((v) => v.freeTier !== "oss"),
  };
  const stats = summarise(dataset);
  return (
    <>
      <WikiPageJsonLd
        category="vergleich"
        slug="grc-vergleich"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und IT-Verantwortliche"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["nis2"]}
      />
      <WikiPageMeta authorSlug="simon-orzel" locale={locale} />
      <GlossedProse locale={locale}>
        {/* The wiki's language, not the request's: a language the wiki is not written in keeps
            the German vendor texts it always had, and a Czech page gets Czech. */}
        <GrcComparisonPage dataset={localiseDataset(dataset, locale)} stats={stats} />
      </GlossedProse>
    </>
  );
}
