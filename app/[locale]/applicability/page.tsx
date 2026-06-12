import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ApplicabilitySection } from "@/components/applicability/ApplicabilitySection";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("applicability");
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: pageAlternates("applicability", locale),
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      type: "website",
      images: [
        {
          url: `/og/applicability-${locale}.png`,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
  };
}

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "NIS2 Applicability Check",
    description: "Free self-assessment tool to check if your company falls under NIS2 (EU 2022/2555) and the German BSIG 2025.",
    url: "https://www.nisd2.eu/applicability",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: "NIS2 Compliance Platform",
      url: "https://www.nisd2.eu",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ApplicabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string | string[] }>;
}) {
  const { locale } = await params;
  const { country: countryParam } = await searchParams;
  const country = Array.isArray(countryParam) ? countryParam[0] : countryParam;
  // Normalise: accept only two-letter ISO codes, ignore the rest so a
  // ?country=javascript:alert(1) never reaches the component.
  const highlightCountry =
    country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : undefined;
  const tLookup = await getTranslations("companyLookup");

  return (
    <>
      <JsonLd />

      <div className="mb-8">
        <MarketingHero
          headline={tLookup("title")}
          subhead={tLookup.rich("subtitle", {
            link: (chunks) => (
              <Link href={"/wiki/anwendungsbereich/nis2-einrichtungen" as never} className="underline hover:text-foreground">
                {chunks}
              </Link>
            ),
          })}
        />
      </div>

      <ApplicabilitySection locale={locale} highlightCountry={highlightCountry} />
    </>
  );
}
