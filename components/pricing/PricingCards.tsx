"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
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

const FeatureList = ({
  keys,
  t,
  prefix,
}: {
  readonly keys: readonly string[];
  readonly t: (k: string) => string;
  readonly prefix: string;
}) => (
  <ul className="space-y-2.5 text-sm">
    {keys.map((key) => (
      <li key={key} className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="leading-snug">{t(`${prefix}.features.${key}`)}</span>
      </li>
    ))}
  </ul>
);

export function PricingCards() {
  const t = useTranslations("pricing");
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      {/* items-start, so the shorter self-host card does not stretch to match the paid one and
          leave a column of empty space under its list. */}
      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card className="relative border-primary shadow-lg ring-1 ring-primary/20">
          <Badge className="-top-3 absolute left-6">{t("free.badge")}</Badge>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t("free.name")}</CardTitle>
            <CardDescription>{t("free.description")}</CardDescription>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-bold text-5xl tracking-tight">{t("free.price")}</span>
              <span className="text-muted-foreground text-sm">{t("free.priceSub")}</span>
            </div>
            <p className="mt-1 text-muted-foreground text-xs">{t("free.vatNote")}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/auth/signin")}
            >
              {t("free.cta")}
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
            <FeatureList keys={paidKeys} t={t} prefix="free" />
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t("selfHost.name")}</CardTitle>
            <CardDescription>{t("selfHost.description")}</CardDescription>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-bold text-5xl tracking-tight">
                {t("selfHost.price")}
              </span>
              <span className="text-muted-foreground text-sm">
                {t("selfHost.priceSub")}
              </span>
            </div>
            {/* An empty line of the same height as the paid card's VAT note, so the two
                buttons sit level. A spacer is honest here; faking it with a margin would
                drift the moment the note changes length. */}
            <p className="mt-1 text-xs opacity-0" aria-hidden>
              &nbsp;
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/open-source">{t("selfHost.cta")}</Link>
            </Button>
            <FeatureList keys={selfHostKeys} t={t} prefix="selfHost" />
          </CardContent>
        </Card>
      </div>

      {/* The guarantee answers the objection the price raises, so it sits directly under the
          price rather than in the terms, and it says what actually happens, including that the
          work already signed off stays theirs. That last part is what makes it credible. */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1">
            <CardTitle className="text-base">{t("guarantee.heading")}</CardTitle>
            <Badge variant="secondary" className="font-normal">
              {t("guarantee.chip")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pl-14">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("guarantee.body")}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl tracking-tight">
            {t("comparison.heading")}
          </h2>
          <p className="text-muted-foreground text-sm">{t("comparison.intro")}</p>
        </div>
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[38%]">{t("comparison.colProvider")}</TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t("comparison.colPrice")}
                  </TableHead>
                  <TableHead>{t("comparison.colNote")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map(({ key, us }) => (
                  <TableRow key={key} className={us ? "bg-primary/5" : undefined}>
                    <TableCell className={us ? "font-semibold" : undefined}>
                      {t(`comparison.rows.${key}.provider`)}
                    </TableCell>
                    <TableCell
                      className={`whitespace-nowrap tabular-nums ${us ? "font-semibold" : ""}`}
                    >
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
        </Card>
      </section>

      <div className="space-y-3 border-t pt-8">
        <p className="mx-auto max-w-2xl text-center text-muted-foreground text-sm leading-relaxed">
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
    </div>
  );
}
