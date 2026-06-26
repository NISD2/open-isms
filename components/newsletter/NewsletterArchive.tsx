import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

/** The newsletter is authored/published in DE, EN, NL only. */
export type NewsletterLocale = "de" | "en" | "nl";

/** Narrow an incoming route locale to the three the newsletter supports. */
export function resolveNewsletterLocale(raw: string): NewsletterLocale {
  return raw === "en" || raw === "nl" ? raw : "de";
}

interface ArchiveIssue {
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: Date | null;
}

export const NEWSLETTER_DATE_LOCALE: Record<NewsletterLocale, string> = {
  de: "de-DE",
  en: "en-GB",
  nl: "nl-NL",
};

export async function NewsletterArchive({
  locale,
  issues,
}: {
  locale: NewsletterLocale;
  issues: ArchiveIssue[];
}) {
  const t = await getTranslations("newsletter");
  const fmt = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString(NEWSLETTER_DATE_LOCALE[locale], { dateStyle: "long" })
      : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">{t("archive.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("archive.intro")}</p>
      </header>

      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("archive.empty")}</p>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <Link
              key={issue.slug}
              href={{ pathname: "/newsletter/[slug]", params: { slug: issue.slug } }}
              className="block transition-colors"
            >
              <Card className="hover:border-primary/40">
                <CardHeader>
                  {issue.publishedAt && (
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("archive.publishedOn", { date: fmt(issue.publishedAt) })}
                    </p>
                  )}
                  <CardTitle className="text-xl">{issue.title}</CardTitle>
                </CardHeader>
                {issue.summary && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{issue.summary}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {t("archive.readIssue")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
