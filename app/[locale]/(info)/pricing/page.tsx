import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { PaidPricingCards } from "@/components/pricing/PaidPricingCards";
import { PricingCards } from "@/components/pricing/PricingCards";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { holderNetCents } from "@/lib/billing/holder-price";
import {
  ANNUAL_NET_CENTS,
  formatEuro,
  formatWholeEuro,
  GRANDFATHERED_NET_CENTS,
} from "@/lib/billing/order";
import { billingFor } from "@/lib/billing/ordering-access";
import { db } from "@/lib/db";
import { isFeatureOn } from "@/lib/feature-flags";
import {
  buildSoftwareApplicationJsonLd,
  type Locale,
  localizedAbsoluteUrl,
  pageAlternates,
  pageOg,
} from "@/lib/seo";

/**
 * The page shows the paid offer only once pricing is launched in the platform admin Pricing tab
 * (lib/billing/launch.ts); before that, the free offer. Read per request (the (info) layout is
 * force-dynamic), once for metadata and page. A public page must not fail on the database, so an
 * error reads as "not launched".
 */
const billingLaunched = cache(() => isFeatureOn(db, "billing").catch(() => false));

const visitorSession = cache(() => getSession().catch(() => null));

/**
 * A platform admin sees the paid page before the launch, to test it with real ordering (which
 * billingFor already opens for them). Metadata stays on billingLaunched alone, so crawlers never
 * see the preview.
 */
const showPaid = async () =>
  (await billingLaunched()) || isPlatformAdmin((await visitorSession())?.user.email);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pricing");
  const launched = await billingLaunched();
  const title = launched ? t("paid.meta.title") : t("meta.title");
  const description = launched
    ? t("paid.meta.description", { price: formatEuro(ANNUAL_NET_CENTS, locale) })
    : t("meta.description");
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
 * invoice will say. A public page must not fail on the database: any error reads as "not open" at
 * the public price.
 */
const visitorOffer = async () => {
  const session = await visitorSession();
  const orderOpen = await billingFor(db, session?.user.email).then(
    (b) => b.open,
    () => false,
  );
  const netCents = await holderNetCents(db, session?.user.id ?? null).catch(
    () => ANNUAL_NET_CENTS,
  );
  return { orderOpen, netCents };
};

const FreePricing = async ({ locale }: { locale: Locale }) => {
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
      <header>
        <MarketingHero centered headline={t("title")} subhead={t("subtitle")} />
      </header>

      <PricingCards />
    </div>
  );
};

const PaidPricing = async ({
  locale,
  rawLocale,
}: {
  locale: Locale;
  rawLocale: string;
}) => {
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
      />
    </div>
  );
};

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";

  return (await showPaid()) ? (
    <PaidPricing locale={locale} rawLocale={rawLocale} />
  ) : (
    <FreePricing locale={locale} />
  );
}
