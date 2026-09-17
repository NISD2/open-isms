"use client";

import { ArrowRight, Wrench } from "lucide-react";
import { usePathname } from "next/navigation";

/**
 * The next step under every docs page.
 *
 * Strings are inline English rather than translated, on purpose. /docs sits
 * outside app/[locale] because it is English only with one canonical URL per
 * page, and its layout passes no messages to NextIntlClientProvider, so
 * useTranslations would throw here. The layout comment explains why that trade
 * was made for the section as a whole.
 *
 * `usePathname` comes from next/navigation rather than next-intl for the same
 * reason: next-intl's version reads a locale from context this subtree does
 * not carry. The href is a plain anchor with an explicit /en prefix, because
 * German is the unprefixed default and somebody who has been reading English
 * about Docker should not land on German.
 *
 * Different offer from the wiki strip. Somebody here is running the thing
 * themselves, so what they might buy is the setup done for them, never NIS 2
 * consulting.
 */
export function DocsHelpCta() {
  const pathname = usePathname();
  const from = encodeURIComponent(pathname.replace(/^\/+/, "").slice(0, 200));

  return (
    <aside className="mt-12 flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Wrench className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Want the setup done for you?</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The source is free and stays free. If you would rather not spend the evening
            on Docker and Postgres, tell us what your environment looks like and we will
            quote the setup as a fixed price.
          </p>
        </div>
      </div>
      <a
        href={`/en/hilfe?from=${from}`}
        className="inline-flex shrink-0 items-center gap-2 self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 sm:self-auto"
      >
        Send a request
        <ArrowRight className="size-4" aria-hidden="true" />
      </a>
    </aside>
  );
}
