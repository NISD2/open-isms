import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

const paidKeys = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;
const selfHostKeys = ["h1", "h2", "h3", "h4"] as const;

export function PricingCards({
  orderOpen,
  price,
  grandfatheredPrice,
}: {
  /** Whether /bestellen exists for this visitor (lib/billing/ordering-access.ts). */
  readonly orderOpen: boolean;
  /** The yearly net price this visitor would be invoiced: 2.400 for a grandfathered account. */
  readonly price: string;
  readonly grandfatheredPrice: string;
}) {
  const t = useTranslations("pricing");

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{t("paid.name")}</CardTitle>
            <CardDescription>{t("paid.description")}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{price}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {t("paid.priceSub")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t("paid.terms")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderOpen ? (
              <Button className="w-full" size="lg" asChild>
                <Link href="/bestellen">{t("paid.cta")}</Link>
              </Button>
            ) : (
              <p className="text-sm">
                {t("paid.courseLine")}{" "}
                <Link
                  href="/training/nis2-ceo"
                  className="underline hover:text-foreground"
                >
                  {t("paid.courseCta")}
                </Link>
              </p>
            )}
            <ul className="space-y-2 text-sm">
              {paidKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{t(`paid.features.${key}`)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm">{t("paid.delivery")}</p>
            <p className="text-sm text-muted-foreground">
              {t("paid.grandfathered", { price: grandfatheredPrice })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("selfHost.name")}</CardTitle>
            <CardDescription>{t("selfHost.description")}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t("selfHost.price")}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {t("selfHost.priceSub")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/open-source">{t("selfHost.cta")}</Link>
            </Button>
            <ul className="space-y-2 text-sm">
              {selfHostKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{t(`selfHost.features.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
        {t("whyFree")}
      </p>

      <p className="text-center text-sm text-muted-foreground">
        {t("consultantFootnote")}{" "}
        {/* /hilfe, not a bare mailto: the referral earns us a commission, and
            the page is where that is disclosed. Sending the reader straight to
            an email composer advertises the offer while leaving out the part
            that makes it honest. */}
        <Link href="/hilfe" className="underline hover:text-foreground">
          {t("consultantCta")}
        </Link>
      </p>
    </div>
  );
}
