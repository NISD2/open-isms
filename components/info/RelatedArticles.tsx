"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { relatedArticles, pageTitleKeys } from "@/lib/seo-related";

export function RelatedArticles() {
  const t = useTranslations("info");
  const pathname = usePathname();

  // Extract slug: /en/what-is-nis2 → what-is-nis2, /what-is-nis2 → what-is-nis2
  const slug = pathname
    .replace(/^\/en\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");

  const related = relatedArticles[slug];
  if (!related || related.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border/40 pt-8">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("relatedArticles.heading")}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {related.map((relatedSlug) => {
          const titleKey = pageTitleKeys[relatedSlug];
          const label = titleKey
            ? t(`footer.${titleKey}` as Parameters<typeof t>[0])
            : relatedSlug;

          return (
            <li key={relatedSlug}>
              <Link
                href={`/${relatedSlug}` as never}
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
