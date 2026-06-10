"use client";

import { useTranslations } from "next-intl";
import { useTermHover } from "./TermHoverContext";

interface SidebarTerm {
  term: string;
  type: "defined" | "vocabulary";
  definition: string;
}

function slugify(term: string): string {
  return term.toLowerCase().replace(/\s+/g, "-");
}

function TermEntry({ term }: { term: SidebarTerm }) {
  const { activeTermSlug, setActiveTermSlug } = useTermHover();
  const slug = slugify(term.term);
  const isActive = activeTermSlug === slug;

  return (
    <div
      data-term-sidebar={slug}
      className={`rounded-md px-2 py-1.5 -mx-2 transition-colors duration-150 ${
        isActive ? "bg-primary/10 ring-1 ring-primary/20" : ""
      }`}
      onMouseEnter={() => setActiveTermSlug(slug)}
      onMouseLeave={() => setActiveTermSlug(null)}
    >
      <dt className="text-sm font-medium">{term.term}</dt>
      <dd className="text-xs text-muted-foreground mt-0.5">
        {term.definition}
      </dd>
    </div>
  );
}

export function DictionarySidebar({ terms }: { terms: SidebarTerm[] }) {
  const t = useTranslations("trainingPortal");

  const defined = terms.filter((t) => t.type === "defined");
  const vocabulary = terms.filter((t) => t.type === "vocabulary");

  return (
    <aside className="sticky top-20 space-y-6 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2">
      {defined.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("definedTerms")}
          </h3>
          <dl className="space-y-1">
            {defined.map((term) => (
              <TermEntry key={term.term} term={term} />
            ))}
          </dl>
        </section>
      )}

      {vocabulary.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("vocabularyWords")}
          </h3>
          <dl className="space-y-1">
            {vocabulary.map((term) => (
              <TermEntry key={term.term} term={term} />
            ))}
          </dl>
        </section>
      )}
    </aside>
  );
}
