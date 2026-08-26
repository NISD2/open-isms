import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { routing } from "@/i18n/routing";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/JsonLd";
import { buildSiteGraphJsonLd, buildSiteNavGraphJsonLd, type Locale } from "@/lib/seo";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  // The `info` namespace holds ~1.8 MB of long-form wiki body content per
  // locale. Server components render it via getTranslations('info'); only
  // RelatedArticles (client) reads from it, and only its footer.* +
  // relatedArticles.* sub-trees. Keep those; drop the rest from the RSC
  // payload so every page stops shipping the wiki bundle.
  const info = messages.info as { footer?: unknown; relatedArticles?: unknown } | undefined;
  const clientMessages = {
    ...messages,
    info: { footer: info?.footer, relatedArticles: info?.relatedArticles },
  };

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
        <NextIntlClientProvider messages={clientMessages} locale={locale}>
          <TRPCProvider>
            {children}
          </TRPCProvider>
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
            <Script
              defer
              src={process.env.ANALYTICS_SCRIPT_URL}
              data-website-id={process.env.ANALYTICS_WEBSITE_ID}
            />
          )}
      </body>
    </html>
  );
}
