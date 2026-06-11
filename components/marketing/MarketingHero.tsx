import { cn } from "@/lib/utils";

/**
 * Marketing hero — the canonical headline + subhead pattern used across
 * landing pages, the wiki index, and the supplier-portal twin pages.
 *
 * Visual contract:
 *   eyebrow      → optional small uppercase-spaced muted label
 *   headline     → the big line (text-3xl semibold tracking-tight, sm:text-5xl)
 *   accent       → optional second clause rendered in `text-primary`; this is
 *                  the "blue last sentence" pattern. Pass when the headline
 *                  naturally splits ("Answer the security questionnaire once."
 *                  + "Share with every customer."); omit otherwise.
 *   subhead      → optional muted paragraph below
 *   centered     → boolean, default false. Centered hero (sicherheitsfragebogen
 *                  style) versus left-aligned (wiki / docs style).
 *
 * Apply to MARKETING pages, not portal/dashboard pages. The portal uses
 * `components/shared/PageHeader.tsx` (icon + tight h1 + actions).
 */
interface MarketingHeroProps {
  /** Small label above the headline. String renders as muted-foreground p;
   *  pass a node (Badge, etc.) for custom styling. */
  eyebrow?: React.ReactNode;
  /** Big line. Pass a string for plain text, or pass a node (from
   *  next-intl's `t.rich(..., { u: (c) => <Underline>{c}</Underline> })`)
   *  to underline emphasis words like "one" or "einen". */
  headline: React.ReactNode;
  /** Optional second clause in `text-primary` — the "blue last sentence"
   *  pattern. Accepts the same ReactNode forms as `headline`. */
  accent?: React.ReactNode;
  subhead?: React.ReactNode;
  centered?: boolean;
  /** Additional content rendered below the subhead (badges, CTAs, etc.) */
  children?: React.ReactNode;
}

/**
 * Underline-as-emphasis token for use inside next-intl rich-text headlines:
 *
 *   <MarketingHero
 *     headline={t.rich("headline", { u: (c) => <Underline>{c}</Underline> })}
 *     accent={t.rich("accent", { u: (c) => <Underline>{c}</Underline> })}
 *   />
 *
 * Marks specific words ("one", "every", "einen", "jedem") in the JSON with
 * `<u>…</u>` and they render with a subtle 2px underline at offset-4. Not
 * a link — pure visual emphasis.
 */
export function Underline({ children }: { children: React.ReactNode }) {
  return (
    <span className="underline decoration-2 underline-offset-4">{children}</span>
  );
}

export function MarketingHero({
  eyebrow,
  headline,
  accent,
  subhead,
  centered = false,
  children,
}: MarketingHeroProps) {
  return (
    <section className={cn(centered && "text-center")}>
      {eyebrow && (
        typeof eyebrow === "string" ? (
          <p
            className={cn(
              "mb-3 text-sm font-medium text-muted-foreground",
              centered && "mx-auto",
            )}
          >
            {eyebrow}
          </p>
        ) : (
          <div className="mb-3">{eyebrow}</div>
        )
      )}
      <h1
        className={cn(
          "max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl",
          centered && "mx-auto",
        )}
      >
        {headline}
        {accent && (
          <>
            {" "}
            <span className="text-primary">{accent}</span>
          </>
        )}
      </h1>
      {subhead && (
        <div
          className={cn(
            "mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg",
            centered && "mx-auto",
          )}
        >
          {subhead}
        </div>
      )}
      {children}
    </section>
  );
}
