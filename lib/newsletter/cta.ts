/**
 * Newsletter call-to-action registry.
 *
 * One soft, rotating CTA is shown per issue — in the email AND on the public
 * permalink — chosen by the admin in the composer. This is the single source of
 * truth for the available CTAs so the two render paths never drift.
 *
 * `href` is a canonical (DE-keyed) path understood by next-intl's <Link> and by
 * getAppUrl()-prefixed absolute URLs in email. `labelKey` resolves against the
 * `newsletter` i18n namespace (cta.<key>). Activation, not sales: tool / course
 * / free gap analysis.
 */
export const NEWSLETTER_CTA_KEYS = ["tool", "course", "gap"] as const;

export type NewsletterCtaKey = (typeof NEWSLETTER_CTA_KEYS)[number];

/** Canonical (DE) CTA targets — each is a registered route in i18n/routing.ts. */
type NewsletterCtaHref = "/nis2-tool" | "/training" | "/applicability";

interface NewsletterCta {
  key: NewsletterCtaKey;
  /** Canonical (DE) path — works with typed <Link> and as an absolute email URL. */
  href: NewsletterCtaHref;
  /** i18n key under the `newsletter` namespace: cta.<key>. */
  labelKey: string;
}

export const NEWSLETTER_CTAS: Record<NewsletterCtaKey, NewsletterCta> = {
  tool: { key: "tool", href: "/nis2-tool", labelKey: "cta.tool" },
  course: { key: "course", href: "/training", labelKey: "cta.course" },
  gap: { key: "gap", href: "/applicability", labelKey: "cta.gap" },
};

/** Narrow an arbitrary stored value to a known CTA, or null. */
export function getNewsletterCta(key: string | null | undefined): NewsletterCta | null {
  if (!key) return null;
  return key in NEWSLETTER_CTAS ? NEWSLETTER_CTAS[key as NewsletterCtaKey] : null;
}
