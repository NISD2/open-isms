import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { pageAlternates, pageOg } from "@/lib/seo";
import {
  NewsletterArchive,
  resolveNewsletterLocale,
} from "@/components/newsletter/NewsletterArchive";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("newsletter");
  const title = t("archive.metaTitle");
  const description = t("archive.metaDescription");
  return {
    title,
    description,
    alternates: pageAlternates("newsletter", locale),
    ...pageOg({ slug: "newsletter", locale, title, description, type: "website" }),
  };
}

export default async function NewsletterArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveNewsletterLocale(rawLocale);
  const issues = await api.newsletterPublic.listPublished();
  return <NewsletterArchive locale={locale} issues={issues} />;
}
