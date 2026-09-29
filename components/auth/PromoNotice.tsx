import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ANNUAL_NET_CENTS,
  formatWholeEuro,
  GRANDFATHERED_NET_CENTS,
} from "@/lib/billing/order";
import { PROMO_COOKIE, type PromoState, promoState } from "@/lib/billing/promo";
import { env } from "@/lib/env";

/**
 * What the promo link means for someone on a sign-in page: the price and its last
 * day while it runs, or that it has ended once the day is past, so a late click
 * reads as an ended offer rather than a broken link. Says nothing without a
 * promo. The link's own code decides, or the cookie the proxy set on an earlier
 * visit (on the very first visit the cookie is not readable yet).
 */
export async function PromoNotice({ fromLink }: { fromLink: string | undefined }) {
  const fromCookie = (await cookies()).get(PROMO_COOKIE)?.value;
  const byLink = promoState(fromLink, env);
  const byCookie = promoState(fromCookie, env);
  const shown: PromoState = byLink.state !== "none" ? byLink : byCookie;
  if (shown.state === "none") return null;

  const [t, locale] = await Promise.all([getTranslations("auth"), getLocale()]);
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${shown.until}T12:00:00Z`));
  const active = shown.state === "active";
  const heading = active ? t("promo.heading") : t("promo.expiredHeading");

  return (
    <section
      aria-label={heading}
      className="mb-6 w-full max-w-md rounded-lg border bg-muted/40 p-4 text-sm"
    >
      <p className="font-medium text-foreground">{heading}</p>
      <p className="mt-1 text-muted-foreground">
        {active
          ? t("promo.body", {
              price: formatWholeEuro(GRANDFATHERED_NET_CENTS, locale),
              fullPrice: formatWholeEuro(ANNUAL_NET_CENTS, locale),
            })
          : t("promo.expiredBody", { date })}
      </p>
      {active && (
        <p className="mt-2 text-muted-foreground">{t("promo.until", { date })}</p>
      )}
    </section>
  );
}
