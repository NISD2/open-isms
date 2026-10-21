import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { PaidPricingCards } from "@/components/pricing/PaidPricingCards";
import { PricingFaq } from "@/components/pricing/PricingFaq";
import { getSession } from "@/lib/auth";
import {
  ANNUAL_NET_CENTS,
  formatEuro,
  formatWholeEuro,
  monthlyNetCents,
} from "@/lib/billing/order";
import { billingFor } from "@/lib/billing/ordering-access";
import { isLocaleCode } from "@/lib/locale";
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

/** Whether this visitor may order. The price is the same for everyone (ANNUAL_NET_CENTS). */
const visitorOffer = async () => {
  const session = await visitorSession();
  return { orderOpen: billingFor(session?.user.email).open, signedIn: session !== null };
};

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocaleCode(rawLocale) ? rawLocale : "de";
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
        price={formatWholeEuro(ANNUAL_NET_CENTS, rawLocale)}
        monthlyPrice={formatWholeEuro(monthlyNetCents(ANNUAL_NET_CENTS), rawLocale)}
        signedIn={offer.signedIn}
      />

      <PricingFaq />
    </div>
  );
}
