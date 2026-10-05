import { CheckCircle2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ANNUAL_NET_CENTS, formatWholeEuro } from "@/lib/billing/order";

/** The same points the /nis2-tool card lists, from the pricing messages. */
const FEATURES = ["guided", "history", "deadlines", "suppliers", "export"] as const;

/**
 * What the walk costs, near the end of a wiki page that answers a search: the list price from the
 * billing constant, the money-back term and the payment terms, all from the pricing messages, so
 * the page says what the pricing page says.
 */
export async function WalkPriceCard() {
  const [tiers, landing, t, locale] = await Promise.all([
    getTranslations("pricing.tiers"),
    getTranslations("landing"),
    getTranslations("info.wikiWalk"),
    getLocale(),
  ]);
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{t("priceHeading")}</h2>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{tiers("paid.name")}</CardTitle>
          <CardDescription>{tiers("paid.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <span className="text-3xl font-semibold tabular-nums">
              {formatWholeEuro(ANNUAL_NET_CENTS, locale)}
            </span>{" "}
            <span className="text-sm text-muted-foreground">
              {tiers("paid.priceSub")}
            </span>
          </p>
          <Badge variant="secondary">{tiers("paid.moneyBack")}</Badge>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {tiers("paid.terms")}
          </p>
          <div className="space-y-2 text-sm">
            {FEATURES.map((feature) => (
              <p key={feature} className="flex gap-2">
                <CheckCircle2
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{tiers(`paid.features.${feature}`)}</span>
              </p>
            ))}
          </div>
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            {landing("walk.pricing")}
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
