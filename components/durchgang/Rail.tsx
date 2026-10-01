"use client";

import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ItemView } from "./view";

/** The same three places on every screen of an item: often missed, terms, law. */
export function Rail({ item }: { item: ItemView }) {
  const t = useTranslations("durchgang.ui");
  return (
    <div className="space-y-8">
      {item.missed.length > 0 && (
        <section className="rounded-2xl border border-amber-300/70 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-100">
            <Eye className="size-4" />
            {t("missed")}
          </h2>
          <ol className="mt-3 space-y-3">
            {item.missed.map((text, i) => (
              <li
                key={text}
                className="flex gap-3 text-sm leading-6 text-amber-950/90 dark:text-amber-50/90"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-semibold text-amber-950 dark:bg-amber-800 dark:text-amber-50">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </section>
      )}

      {item.terms.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("terms")}
          </h2>
          <div className="mt-2 divide-y border-y">
            {item.terms.map((term) => (
              <details key={term.term} className="group py-2.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
                  {term.term}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {term.definition}
                </p>
                {term.source && (
                  <p className="mt-1 text-xs text-primary">{term.source}</p>
                )}
              </details>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t("law")}
        </h2>
        <ul className="mt-3 space-y-3">
          {item.citations.map((row) => (
            <li key={`${row.label}${row.citation}`} className="flex gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted font-serif text-sm text-foreground/70">
                §
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                {row.href ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {row.citation}
                  </a>
                ) : (
                  <p className="font-medium">{row.citation}</p>
                )}
                {row.note && (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {row.note}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
