"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { relatedArticles, pageTitleKeys, relatedPathname } from "@/lib/seo-related";

export function RelatedArticles() {
  const t = useTranslations("info");
  const pathname = usePathname();

  // next-intl's usePathname returns the CANONICAL pathname, not the localized
  // one, so /nl/prijzen and /en/pricing both arrive here as /pricing. The raw
  // next/navigation hook returned the localized URL and this stripped only an
  // /en/ prefix, so every Dutch page looked up a slug like "nl/prijzen", found
  // nothing, and rendered no related block at all.
  const slug = pathname.replace(/^\//, "").replace(/\/$/, "");

  const related = relatedArticles[slug];

  // Resolve the hrefs BEFORE deciding whether there is anything to show.
  // relatedPathname returns null by design for a slug that no longer
  // resolves, so checking the raw slug list first would render the heading,
  // the border-top separator and an empty <ul> for a page whose related
  // entries have all been retired from routing.pathnames or unpublished.
  const cards = (related ?? []).flatMap((relatedSlug) => {
    const href = relatedPathname(relatedSlug);
    return href ? [{ relatedSlug, href }] : [];
  });
  if (cards.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border/40 pt-8">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("relatedArticles.heading")}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {cards.map(({ relatedSlug, href }) => {
          const titleKey = pageTitleKeys[relatedSlug];
          const label = titleKey
            ? t(`footer.${titleKey}` as Parameters<typeof t>[0])
            : relatedSlug;

          return (
            <li key={relatedSlug}>
              <Link
                href={href}
                className="group flex items-center gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50"
              >
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
