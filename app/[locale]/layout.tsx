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
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </NextIntlClientProvider>
        <Toaster />
        {process.env.NODE_ENV === "production" && (
          <Script
            defer
            src="https://analytics.sorzel.com/script.js"
            data-website-id="a1c48dc2-a9f6-4c09-a3ec-d2e93022f734"
          />
        )}
      </body>
    </html>
  );
}
