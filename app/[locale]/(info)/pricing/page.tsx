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
  netCentsFor,
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
import { api } from "@/lib/trpc/server";

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

/**
 * Whether this visitor may order, and at what yearly price. The price comes from the open company's
 * stored level, as on /bestellen (billing.status), so the card shows what the invoice will say. A
 * public page must not fail on the database: any error reads as "not open" at the public price.
 */
const visitorOffer = async () => {
  const session = await getSession().catch(() => null);
  const orderOpen = await billingFor(db, session?.user.email).then(
    (b) => b.open,
    () => false,
  );
  const level = session?.companyId
    ? await api.billing.status().then(
        (s) => s.accessLevel,
        () => null,
      )
    : null;
  return { orderOpen, netCents: level ? netCentsFor(level) : ANNUAL_NET_CENTS };
};

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("pricing");
  const offer = await visitorOffer();
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
        orderOpen={offer.orderOpen}
        price={formatEuro(offer.netCents, rawLocale)}
        grandfatheredPrice={formatEuro(GRANDFATHERED_NET_CENTS, rawLocale)}
      />
    </div>
  );
}
