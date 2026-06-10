import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  pageAlternates,
  pageOg,
  buildSoftwareApplicationJsonLd,
  type Locale,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PricingCards } from "@/components/pricing/PricingCards";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pricing");
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("pricing", locale),
    ...pageOg({ slug: "pricing", locale, title, description, type: "website" }),
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("pricing");

  return (
    <div className="space-y-10">
      <JsonLd
        data={buildSoftwareApplicationJsonLd({
          slug: "pricing",
          locale,
          name: t("meta.title"),
          description: t("meta.description"),
        })}
      />
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </header>

      <PricingCards />
    </div>
  );
}
