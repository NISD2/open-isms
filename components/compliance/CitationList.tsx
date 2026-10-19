"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  buildCitationRows,
  type CitationSource,
  type FrameworkLabel,
  typesetCitation,
} from "@/lib/compliance/citations";

/**
 * A requirement's legal citations, one row per text: the framework, its national law, and the CIR
 * on a row of its own with the note that it binds only the entity types in its Art. 1. The link
 * sits on the framework name, not on the citation: it opens that law's source page for the
 * category, which is not always the exact article the citation names.
 */
export function CitationList({
  source,
  locale,
}: {
  readonly source: CitationSource;
  readonly locale: string;
}) {
  const tp = useTranslations("portal");
  const tUi = useTranslations("durchgang.ui");
  const labelOf = (label: FrameworkLabel) =>
    label.kind === "message" ? tp(label.key) : label.text;

  return (
    <div data-tour="requirement-legal" className="space-y-2">
      {/* Wraps, so a long label (a Czech decree) puts its citation on the next line instead of
          squeezing it to one word per line. */}
      {buildCitationRows(source, locale).map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5"
        >
          <dt className="shrink-0 text-muted-foreground">
            {row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {labelOf(row.label)}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              labelOf(row.label)
            )}
          </dt>
          <dd className="ml-auto text-right text-xs text-muted-foreground">
            {row.id === "cir"
              ? typesetCitation(tUi("cirAnnex", { ref: row.citation }))
              : row.citation}
          </dd>
          {row.id === "cir" && (
            <dd className="w-full text-xs text-muted-foreground">
              {typesetCitation(tUi("cirNote"))}
            </dd>
          )}
        </div>
      ))}
    </div>
  );
}
