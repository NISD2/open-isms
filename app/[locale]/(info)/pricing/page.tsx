import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { PricingCards } from "@/components/pricing/PricingCards";
import { getSession } from "@/lib/auth";
import {
  ANNUAL_NET_CENTS,
  formatEuro,
  GRANDFATHERED_NET_CENTS,
} from "@/lib/billing/order";
import { billingFor } from "@/lib/billing/ordering-access";
import { db } from "@/lib/db";
import {
  buildSoftwareApplicationJsonLd,
  type Locale,
  localizedAbsoluteUrl,
  pageAlternates,
  pageOg,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pricing");
  const title = t("meta.title");
  const description = t("meta.description", {
    price: formatEuro(ANNUAL_NET_CENTS, locale),
  });
  return {
    title,
    description,
    alternates: pageAlternates("pricing", locale),
    ...pageOg({
      slug: "pricing",
      locale,
      title,
      description,
      type: "website",
      image: `/og/pricing-${locale}.png`,
    }),
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
  const session = await getSession();
  const billing = await billingFor(db, session?.user.email);
  const price = formatEuro(ANNUAL_NET_CENTS, rawLocale);
  const annualNet = (ANNUAL_NET_CENTS / 100).toFixed(2);
  const softwareJsonLd = buildSoftwareApplicationJsonLd({
    slug: "pricing",
    locale,
    name: t("meta.title"),
    description: t("meta.description", { price }),
  });

  return (
    <div className="space-y-10">
      <JsonLd
        data={{
          ...softwareJsonLd,
          isAccessibleForFree: false,
          offers: {
            "@type": "Offer",
            price: annualNet,
            priceCurrency: "EUR",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: annualNet,
              priceCurrency: "EUR",
              valueAddedTaxIncluded: false,
              unitCode: "ANN",
            },
            url: localizedAbsoluteUrl("/pricing", locale),
          },
        }}
      />
      <header>
        <MarketingHero centered headline={t("title")} subhead={t("subtitle")} />
      </header>

      <PricingCards
        orderOpen={billing.open}
        price={price}
        grandfatheredPrice={formatEuro(GRANDFATHERED_NET_CENTS, rawLocale)}
      />
    </div>
  );
}
