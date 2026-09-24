"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";

const paidKeys = ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10"] as const;
const selfHostKeys = ["h1", "h2", "h3", "h4", "h5", "h6", "h7"] as const;

/**
 * The comparison rows. `us` marks our own line so it can be emphasised without the component
 * guessing from the text, and so a future price change cannot silently un-highlight it.
 *
 * The figures are the providers' own published prices, recorded in the market shelf. They are not
 * estimates and must not become estimates: every one of them has a source behind it.
 */
const comparisonRows = [
  { key: "r1", us: false },
  { key: "r2", us: true },
  { key: "r3", us: false },
  { key: "r4", us: false },
] as const;

export function PricingCards() {
  const t = useTranslations("pricing");
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{t("free.name")}</CardTitle>
            <CardDescription>{t("free.description")}</CardDescription>
            <div className="mt-4">
              <span className="font-bold text-4xl">{t("free.price")}</span>
              <span className="ml-2 text-muted-foreground text-sm">
                {t("free.priceSub")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/auth/signin")}
            >
              {t("free.cta")}
            </Button>
            <ul className="space-y-2 text-sm">
              {paidKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
              <span className="font-bold text-4xl">{t("selfHost.price")}</span>
              <span className="ml-2 text-muted-foreground text-sm">
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
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{t(`selfHost.features.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* The guarantee is the answer to the objection the price raises, so it sits directly under
          the price rather than in the terms. It says what actually happens, including that the
          work already signed off stays theirs, because that is the part that makes it credible. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("guarantee.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("guarantee.body")}</p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">{t("comparison.heading")}</h2>
        <p className="text-muted-foreground text-sm">{t("comparison.intro")}</p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("comparison.colProvider")}</TableHead>
                <TableHead>{t("comparison.colPrice")}</TableHead>
                <TableHead>{t("comparison.colNote")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map(({ key, us }) => (
                <TableRow key={key} className={us ? "bg-muted/50" : undefined}>
                  <TableCell className={us ? "font-medium" : undefined}>
                    {t(`comparison.rows.${key}.provider`)}
                  </TableCell>
                  <TableCell className={us ? "font-medium" : undefined}>
                    {t(`comparison.rows.${key}.price`)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {t(`comparison.rows.${key}.note`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <p className="mx-auto max-w-2xl text-center text-muted-foreground text-sm">
        {t("whyFree")}
      </p>

      <p className="text-center text-muted-foreground text-sm">
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
