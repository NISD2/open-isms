import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import grcVendorsRaw from "@/data/grc-vendors.json";
import { loadVendorDataset, summarise, type VendorDataset } from "@/lib/grc-vendors/schema";
import { GrcComparisonPage } from "@/components/grc-comparison/GrcComparisonPage";

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
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
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
      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />
      <GlossedProse locale={locale}>
        <GrcComparisonPage dataset={dataset} stats={stats} locale={locale} />
      </GlossedProse>
    </>
  );
}
