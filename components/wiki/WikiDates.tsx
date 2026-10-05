import type { ReactNode } from "react";
import { LAW_CHIP } from "@/components/wiki/WikiSection";

export interface WikiDate {
  readonly when: string;
  readonly what: string;
  readonly law: string;
}

/**
 * Deadlines as rows: when on the left, what happens and its provision on the right. On a phone
 * the two columns stack, so the date stays above its sentence.
 */
export function WikiDates({
  heading,
  lead,
  items,
  children,
}: {
  heading: string;
  lead: string;
  items: readonly WikiDate[];
  children?: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          {lead}
        </p>
      </div>
      <div className="divide-y rounded-xl border">
        {items.map(({ when, what, law }) => (
          <div
            key={when}
            className="grid gap-1.5 p-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6"
          >
            <p className="text-sm font-semibold">{when}</p>
            <div className="space-y-1.5">
              <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                {what}
              </p>
              <p>
                <span className={LAW_CHIP}>{law}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
      {children}
    </section>
  );
}
