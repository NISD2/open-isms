"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const freeKeys = ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10"] as const;
const selfHostKeys = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

export function PricingCards() {
  const t = useTranslations("pricing");
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{t("free.name")}</CardTitle>
            <CardDescription>{t("free.description")}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t("free.price")}</span>
              <span className="ml-2 text-sm text-muted-foreground">{t("free.priceSub")}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg" onClick={() => router.push("/auth/signin")}>
              {t("free.cta")}
            </Button>
            <ul className="space-y-2 text-sm">
              {freeKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{t(`free.features.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("selfHost.name")}</CardTitle>
            <CardDescription>{t("selfHost.description")}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t("selfHost.price")}</span>
              <span className="ml-2 text-sm text-muted-foreground">{t("selfHost.priceSub")}</span>
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
