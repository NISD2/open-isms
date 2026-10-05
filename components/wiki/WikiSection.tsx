import type { ReactNode } from "react";

export const LAW_CHIP =
  "inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground ring-1 ring-inset ring-border";

/**
 * One topic of a wiki page that answers a search: a heading, short paragraphs of one idea each,
 * the provision it rests on as a chip, and whatever the topic needs below (a table, a link).
 */
export function WikiSection({
  heading,
  paragraphs,
  law,
  id,
  children,
}: {
  heading: string;
  paragraphs: readonly string[];
  /** The provision, as printed, e.g. "§ 38 Abs. 1 BSIG · Art. 20 Abs. 1 NIS 2". */
  law?: string;
  /** An anchor for links from the same page. */
  id?: string;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground"
        >
          {paragraph}
        </p>
      ))}
      {law && (
        <p>
          <span className={LAW_CHIP}>{law}</span>
        </p>
      )}
      {children}
    </section>
  );
}

/** A worked example with a made-up company: the lead sets the scene, each item is one beat. */
export function WikiExample({
  heading,
  lead,
  items,
}: {
  heading: string;
  lead: string;
  items: readonly string[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{lead}</p>
      <div className="space-y-2 border-l-2 border-primary/30 pl-4">
        {items.map((item) => (
          <p key={item} className="max-w-[62ch] text-sm leading-relaxed">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

export interface WikiQuestion {
  readonly q: string;
  readonly a: string;
}

/** Questions readers ask, each answered in a few sentences. The page puts the same list in its FAQ JSON-LD. */
export function WikiFaq({
  heading,
  items,
}: {
  heading: string;
  items: readonly WikiQuestion[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      <div className="divide-y rounded-xl border">
        {items.map(({ q, a }) => (
          <div key={q} className="space-y-1.5 p-4">
            <h3 className="text-sm font-semibold">{q}</h3>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The primary sources a page's legal sentences were checked against. */
export function WikiSources({
  heading,
  items,
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{heading}</h2>
      <ul className="space-y-1.5">
        {items.map((source) => (
          <li key={source} className="text-xs leading-relaxed text-muted-foreground">
            {source}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The FAQPage JSON-LD for the same questions the page shows. */
export const faqJsonLd = (items: readonly WikiQuestion[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(({ q, a }) => ({
    "@type": "Question" as const,
    name: q,
    acceptedAnswer: { "@type": "Answer" as const, text: a },
  })),
});
