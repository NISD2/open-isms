import { Check, Code2, FileText, Info, Receipt, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";

// Every line is checked against the code or the AGB. "Deadlines and reminders" means the in-app
// reminders the nightly cron schedules; deadline digests by email go out only when an operator
// presses send (lib/mail/digest-outbox.ts), so the list does not promise email.
const freeFeatures = ["courses", "wiki", "tools"] as const;
const paidFeatures = [
  "guided",
  "unlimited",
  "history",
  "deadlines",
  "suppliers",
  "export",
  "updates",
] as const;
const selfHostFeatures = ["everything", "infrastructure", "licence", "contract"] as const;

const SOURCE_URL = "https://github.com/NISD2/open-isms";
const PAID_CARD_ID = "durchgang";

// From the LICENSE files and package.json licence fields (the README's table is older than
// they are). `spdx` is shown as is; the other two rows carry translated wording.
const LICENCES = [
  { key: "app", packages: "app, @nisd2/isms-*", spdx: "AGPL-3.0-or-later" },
  {
    key: "dual",
    packages:
      "@nisd2/grc-data-model, @nisd2/nis2-supply-chain-questionnaire-schema, @nisd2/incident-notification-schema",
    spdx: null,
  },
  { key: "courses", packages: "courses/", spdx: null },
] as const;

function FeatureItem({
  children,
  highlighted,
}: {
  children: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <li className="flex items-start gap-3 text-sm leading-snug">
      {highlighted ? (
        <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      ) : (
        <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <span className={highlighted ? "text-foreground" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}

function SideTier({
  name,
  description,
  price,
  priceSub,
  cta,
  features,
}: {
  readonly name: string;
  readonly description: string;
  readonly price: string;
  readonly priceSub: string;
  readonly cta: ReactNode;
  readonly features: readonly { readonly key: string; readonly content: ReactNode }[];
}) {
  return (
    <Card className="h-full border-border/70 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight">{price}</span>
          <span className="text-sm text-muted-foreground">{priceSub}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {cta}
        <Separator />
        <ul className="space-y-3">
          {features.map((feature) => (
            <FeatureItem key={feature.key}>{feature.content}</FeatureItem>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * The /pricing tiers once billing is launched: learning on the left, the paid Durchgang in the
 * middle as the obvious choice, self-hosting on the right. PricingCards is the free offer shown
 * before the launch.
 */
export function PaidPricingCards({
  orderOpen,
  price,
  listPrice,
  grandfathered,
  grandfatheredPrice,
}: {
  /** Whether /bestellen exists for this visitor (lib/billing/ordering-access.ts). */
  readonly orderOpen: boolean;
  /** The yearly net price this visitor would be invoiced. */
  readonly price: string;
  /** The public yearly net price, struck through when the visitor pays less. */
  readonly listPrice: string;
  /** Whether this visitor is a grandfathered account holder (AGB B4). */
  readonly grandfathered: boolean;
  readonly grandfatheredPrice: string;
}) {
  const t = useTranslations("pricing.tiers");
  const tp = useTranslations("pricing");

  const externalLink =
    "underline decoration-primary/30 underline-offset-4 hover:decoration-primary";

  const tiers = (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* group/tiers: hovering or focusing the self-host link to the paid tier lights the
          paid card up, without client state. */}
      <div className="group/tiers grid gap-6 lg:grid-cols-3 lg:items-start">
        <SideTier
          name={t("free.name")}
          description={t("free.description")}
          price={t("free.price")}
          priceSub={t("free.priceSub")}
          cta={
            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/training/nis2-ceo">{t("free.cta")}</Link>
            </Button>
          }
          features={freeFeatures.map((key) => ({
            key,
            content: t.rich(`free.features.${key}`, {
              course: (chunks) => (
                <Link href="/training/nis2-ceo" className={externalLink}>
                  {chunks}
                </Link>
              ),
            }),
          }))}
        />

        {/* order-first: on a phone the paid tier is the first card, not the third. */}
        <Card
          id={PAID_CARD_ID}
          className="relative order-first scroll-mt-24 border-2 border-primary shadow-xl shadow-primary/10 transition duration-200 group-has-[[data-paid-link]:focus-visible]/tiers:scale-[1.02] group-has-[[data-paid-link]:focus-visible]/tiers:ring-8 group-has-[[data-paid-link]:focus-visible]/tiers:ring-primary/15 group-has-[[data-paid-link]:hover]/tiers:scale-[1.02] group-has-[[data-paid-link]:hover]/tiers:ring-8 group-has-[[data-paid-link]:hover]/tiers:ring-primary/15 lg:order-none lg:-mt-4"
        >
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1">
            {t("recommended")}
          </Badge>
          <CardHeader className="pt-2">
            <CardTitle className="text-xl">{t("paid.name")}</CardTitle>
            <CardDescription>{t("paid.description")}</CardDescription>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {grandfathered ? (
                <span className="text-xl text-muted-foreground line-through decoration-2">
                  {listPrice}
                </span>
              ) : null}
              <span className="text-5xl font-bold tracking-tight">{price}</span>
              <span className="text-sm text-muted-foreground">{t("paid.priceSub")}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Hover or focus explains AGB B7; on touch the terms line under the button says
                  the same in short. */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex cursor-help items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20 dark:hover:bg-emerald-500/15"
                  >
                    <ShieldCheck className="size-4" />
                    {t("paid.moneyBack")}
                    <Info className="size-3.5 opacity-60" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  className="max-w-xs text-left leading-relaxed"
                  sideOffset={6}
                >
                  {t("paid.moneyBackDetail")}
                </TooltipContent>
              </Tooltip>
              {grandfathered ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                  {t("paid.grandfatheredBadge")}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {/* Closed only before live keys (sandbox, or no Qonto at all), which a visitor
                  never reaches once the page is launched, so the button keeps its place. */}
              {orderOpen ? (
                <Button className="h-12 w-full text-base" size="lg" asChild>
                  <Link href="/bestellen">{t("paid.cta")}</Link>
                </Button>
              ) : (
                <Button className="h-12 w-full text-base" size="lg" disabled>
                  {t("paid.cta")}
                </Button>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("paid.terms")}{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {t("paid.termsLink")}
                </Link>
              </p>
            </div>
            <Separator />
            <ul className="space-y-3">
              {paidFeatures.map((key) => (
                <FeatureItem key={key} highlighted>
                  {key === "unlimited" ? (
                    <strong className="font-semibold">{t(`paid.features.${key}`)}</strong>
                  ) : (
                    t(`paid.features.${key}`)
                  )}
                </FeatureItem>
              ))}
            </ul>
          </CardContent>
        </Card>

        <SideTier
          name={t("selfHost.name")}
          description={t("selfHost.description")}
          price={t("selfHost.price")}
          priceSub={t("selfHost.priceSub")}
          cta={
            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/open-source">{t("selfHost.cta")}</Link>
            </Button>
          }
          features={selfHostFeatures.map((key) => {
            const text = t.rich(`selfHost.features.${key}`, {
              paid: (chunks) => (
                <a href={`#${PAID_CARD_ID}`} data-paid-link className={externalLink}>
                  {chunks}
                </a>
              ),
            });
            return {
              key,
              content:
                key === "licence" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="cursor-help text-left underline decoration-muted-foreground/40 decoration-dotted underline-offset-4 hover:text-foreground"
                      >
                        {text}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      className="max-w-sm text-left leading-relaxed"
                      sideOffset={6}
                    >
                      <p className="mb-1.5 font-medium">{t("selfHost.licences.title")}</p>
                      <ul className="space-y-1.5">
                        {LICENCES.map((licence) => (
                          <li key={licence.key}>
                            <span className="font-mono text-[0.7rem] opacity-80">
                              {licence.packages}
                            </span>
                            <br />
                            {licence.spdx ?? t(`selfHost.licences.${licence.key}`)}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  text
                ),
            };
          })}
        />
      </div>

      <ul className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap">
        <li className="flex items-center gap-2">
          <Receipt className="size-4 text-primary" />
          {t("trust.invoice")}
        </li>
        <li className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <span>
            {t.rich("trust.documents", {
              terms: (chunks) => (
                <Link href="/terms" className={externalLink}>
                  {chunks}
                </Link>
              ),
              avv: (chunks) => (
                <Link href="/avv" className={externalLink}>
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Code2 className="size-4 text-primary" />
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={externalLink}
          >
            {t("trust.openSource")}
          </a>
        </li>
      </ul>

      {grandfathered ? null : (
        <p className="text-center text-sm text-muted-foreground">
          {t("paid.grandfatheredNote", { price: grandfatheredPrice })}
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {tp("consultantFootnote")}{" "}
        {/* /hilfe, not a bare mailto: the referral earns us a commission, and
            the page is where that is disclosed. Sending the reader straight to
            an email composer advertises the offer while leaving out the part
            that makes it honest. */}
        <Link href="/hilfe" className="underline hover:text-foreground">
          {tp("consultantCta")}
        </Link>
      </p>
    </div>
  );

  return <TooltipProvider delayDuration={100}>{tiers}</TooltipProvider>;
}
