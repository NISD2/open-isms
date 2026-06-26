import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TRPCError } from "@trpc/server";
import { api } from "@/lib/trpc/server";
import { pageAlternates, pageOg } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import {
  resolveNewsletterLocale,
  NEWSLETTER_DATE_LOCALE,
} from "@/components/newsletter/NewsletterArchive";
import { getNewsletterCta } from "@/lib/newsletter/cta";

type Params = Promise<{ locale: string; slug: string }>;

async function loadIssue(rawLocale: string, slug: string) {
  const locale = resolveNewsletterLocale(rawLocale);
  try {
    const issue = await api.newsletterPublic.getPublishedBySlug({ slug });
    return { issue, locale };
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loaded = await loadIssue(locale, slug);
  if (!loaded) return {};
  const { issue } = loaded;
  const description = issue.summary ?? issue.title;
  return {
    title: issue.title,
    description,
    alternates: pageAlternates(`newsletter/${slug}`, locale),
    ...pageOg({
      slug: `newsletter/${slug}`,
      locale,
      title: issue.title,
      description,
      type: "article",
    }),
  };
}

export default async function NewsletterIssuePage({ params }: { params: Params }) {
  const { locale: rawLocale, slug } = await params;
  const loaded = await loadIssue(rawLocale, slug);
  if (!loaded) notFound();
  const { issue, locale } = loaded;

  const t = await getTranslations("newsletter");
  const cta = getNewsletterCta(issue.ctaKey);
  const publishedOn = issue.publishedAt
    ? new Date(issue.publishedAt).toLocaleDateString(NEWSLETTER_DATE_LOCALE[locale], {
        dateStyle: "long",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/newsletter"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("issue.backToArchive")}
      </Link>

      <header className="mb-8">
        {publishedOn && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("issue.publishedOn", { date: publishedOn })}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{issue.title}</h1>
        {issue.summary && <p className="mt-3 text-lg text-muted-foreground">{issue.summary}</p>}
      </header>

      <article
        className="prose prose-neutral max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: issue.bodyHtml }}
      />

      {cta && (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>{t("issue.ctaHeading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={cta.href}>{t(cta.labelKey)}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
