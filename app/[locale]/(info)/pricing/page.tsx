import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { PaidPricingCards } from "@/components/pricing/PaidPricingCards";
import { PricingFaq } from "@/components/pricing/PricingFaq";
import { getSession } from "@/lib/auth";
import { holderNetCents } from "@/lib/billing/holder-price";
import {
  ANNUAL_NET_CENTS,
  formatEuro,
  formatWholeEuro,
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

/** Read once per request (the (info) layout is force-dynamic). A public page must not fail on it. */
const visitorSession = cache(() => getSession().catch(() => null));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pricing");
  const title = t("paid.meta.title");
  const description = t("paid.meta.description", {
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
 * Whether this visitor may order, and at what yearly price. The price is the visitor's own holder
 * price, the one the order's quote and invoice use (billing.quote), so the card shows what the
 * invoice will say. A public page must not fail on the database: an error reads as the public
 * price.
 */
const visitorOffer = async () => {
  const session = await visitorSession();
  const orderOpen = billingFor(session?.user.email).open;
  const netCents = await holderNetCents(db, session?.user.id ?? null).catch(
    () => ANNUAL_NET_CENTS,
  );
  return { orderOpen, netCents, signedIn: session !== null };
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
    name: t("paid.meta.title"),
    description: t("paid.meta.description", { price }),
  });

  return (
    <div className="space-y-6">
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
        <MarketingHero centered headline={t("title")} subhead={t("tiers.subtitle")} />
      </header>

      <PaidPricingCards
        orderOpen={offer.orderOpen}
        price={formatWholeEuro(offer.netCents, rawLocale)}
        listPrice={formatWholeEuro(ANNUAL_NET_CENTS, rawLocale)}
        grandfathered={offer.netCents === GRANDFATHERED_NET_CENTS}
        grandfatheredPrice={formatWholeEuro(GRANDFATHERED_NET_CENTS, rawLocale)}
        signedIn={offer.signedIn}
      />

      <PricingFaq />
    </div>
  );
}
