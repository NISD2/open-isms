import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { clientMessages, PUBLIC_CLIENT_NAMESPACES } from "@/lib/client-messages";
import { ogImages } from "@/lib/og-card";
import { buildSiteGraphJsonLd, buildSiteNavGraphJsonLd, type Locale } from "@/lib/seo";
import { TRPCProvider } from "@/lib/trpc/provider";

/**
 * The share card for any page that sets no Open Graph block of its own: the
 * home card in its locale. Without it those pages inherit the root layout's
 * site-wide block, whose static image and title predate the current offer.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "landing.guided.meta" });
  return {
    openGraph: {
      type: "website",
      siteName: "nisd2.eu",
      images: ogImages("home", locale, t("title")),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Anything added to the public set ships to every page.
  const messages = clientMessages(await getMessages(), PUBLIC_CLIENT_NAMESPACES);

  return (
    <html lang={locale}>
      <head>
        {/*
          Site-wide @graph: WebSite + Organization. Persons are
          author-specific and declared only on /autor/<slug>.
          Page-specific JSON-LD references these by @id.
        */}
        <JsonLd data={buildSiteGraphJsonLd(locale as Locale)} />
        {/*
          Site-navigation @graph: header nav + 3 footer columns as
          SiteNavigationElement. Gives crawlers a clean site graph
          and helps with SiteLinks eligibility.
        */}
        <JsonLd data={buildSiteNavGraphJsonLd(locale as Locale)} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <TRPCProvider>{children}</TRPCProvider>
        </NextIntlClientProvider>
        <Toaster />
        {/*
          Analytics is opt-in and unconfigured by default, so a self-hosted
          instance reports to nobody unless its operator says otherwise. Both
          values are required; one without the other renders nothing.
        */}
        {process.env.NODE_ENV === "production" &&
          process.env.ANALYTICS_SCRIPT_URL &&
          process.env.ANALYTICS_WEBSITE_ID && (
            <Analytics
              src={process.env.ANALYTICS_SCRIPT_URL}
              websiteId={process.env.ANALYTICS_WEBSITE_ID}
            />
          )}
      </body>
    </html>
  );
}
