import {
  Building2,
  Check,
  ChevronRight,
  Code2,
  FileText,
  Info,
  Receipt,
  Scale,
  Send,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SignInLink } from "@/components/auth/SignInLink";
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
import { getPathname, Link } from "@/i18n/navigation";
import { formatWholeEuro } from "@/lib/billing/order";
import { cn } from "@/lib/utils";
import { BookingLink } from "./BookingLink";

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
  "call",
] as const;
const selfHostFeatures = ["everything", "infrastructure", "licence", "contract"] as const;

const SOURCE_URL = "https://github.com/NISD2/open-isms";
const PAID_CARD_ID = "durchgang";

// From the LICENSE files and package.json licence fields (the README's table is older than
// they are). `spdx` is shown as is; the other two rows carry translated wording.
const LICENCES = [
  { key: "app", packages: ["app", "@nisd2/isms-*"], spdx: "AGPL-3.0-or-later" },
  {
    key: "dual",
    packages: [
      "@nisd2/grc-data-model",
      "@nisd2/nis2-supply-chain-questionnaire-schema",
      "@nisd2/incident-notification-schema",
    ],
    spdx: null,
  },
  { key: "courses", packages: ["courses/"], spdx: null },
] as const;

/**
 * Published one-off prices for a NIS 2 gap analysis, each from the provider's own page: cyberkom
 * 2.000 fixed (up to 500 staff), ing-ism from 3.900 and from 6.900, Blackfort "Gap" from 4.900,
 * DATAGROUP 4.990, secunet from 5.000. Blackfort's 8.500 tier adds a roadmap and is left out.
 * Most are starting prices, which the copy says; most pages do not say net, so the copy does not.
 * A price comparison must be verifiable (§ 6 Abs. 2 Nr. 2 UWG), so the sources are named on the
 * page, and a stale one misleads (§ 5 UWG): re-check every quarter and move `checked`.
 */
const GAP_ANALYSIS_PRICES = {
  lowCents: 200_000,
  highCents: 690_000,
  sources: ["cyberkom", "ing-ism", "Blackfort", "DATAGROUP", "secunet"],
  checked: "2026-10-04",
} as const;

const moneyBackPoints = ["first", "cancel", "refund", "data"] as const;
const unlimitedPoints = ["structure", "users", "payment"] as const;

const externalLink =
  "underline decoration-primary/30 underline-offset-4 hover:decoration-primary";

/**
 * A tooltip styled like the app's popovers (popover tokens, border, shadow) rather than the
 * default dark chip: the popover pair keeps full contrast in both themes, and a longer
 * explanation reads better on it. The default arrow is dark, so it is made invisible (not
 * `hidden`: Radix sets `display: block` on it inline).
 */
function InfoPanel({
  title,
  icon,
  note,
  children,
}: {
  readonly title: string;
  readonly icon: ReactNode;
  readonly note?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <TooltipContent
      sideOffset={8}
      className="w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-0 text-left text-sm text-popover-foreground shadow-lg [&_.fill-foreground]:invisible"
    >
      <div className="space-y-3 p-4">
        <p className="flex items-center gap-2 font-semibold leading-none">
          {icon}
          {title}
        </p>
        {children}
      </div>
      {note ? (
        <p className="rounded-b-lg border-t bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      ) : null}
    </TooltipContent>
  );
}

function PanelPoints({ points }: { readonly points: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2 leading-snug">
          <Check
            className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            strokeWidth={3}
          />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

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

/** The thirty days money back as a chip; hover or focus explains AGB B7. */
export function MoneyBackBadge() {
  const t = useTranslations("pricing.tiers");
  return (
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
      <InfoPanel
        title={t("paid.moneyBackTip.title")}
        icon={<ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />}
        note={t("paid.moneyBackTip.note")}
      >
        <PanelPoints
          points={moneyBackPoints.map((key) => t(`paid.moneyBackTip.points.${key}`))}
        />
      </InfoPanel>
    </Tooltip>
  );
}

/** The published gap analysis range, its sources and the day it was checked, for one locale. */
export const gapAnalysisRange = (locale: string) => ({
  low: formatWholeEuro(GAP_ANALYSIS_PRICES.lowCents, locale),
  high: formatWholeEuro(GAP_ANALYSIS_PRICES.highCents, locale),
  sources: new Intl.ListFormat(locale, { type: "conjunction" }).format(
    GAP_ANALYSIS_PRICES.sources,
  ),
  checked: new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${GAP_ANALYSIS_PRICES.checked}T12:00:00Z`)),
});

/**
 * The list price set against what a gap analysis alone costs; hover or focus gives the published
 * range. "For the price of", never "cheaper than": the low end of the range is below our price.
 */
export function PriceAnchor() {
  const t = useTranslations("pricing.tiers");
  const { low, high, sources, checked } = gapAnalysisRange(useLocale());
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="mt-2 cursor-help text-left text-sm text-muted-foreground underline decoration-muted-foreground/40 decoration-dotted underline-offset-4 hover:decoration-foreground"
        >
          {t("paid.anchor")}
        </button>
      </TooltipTrigger>
      <InfoPanel
        title={t("paid.anchorTip.title")}
        icon={<Receipt className="size-4 text-primary" />}
        note={t("paid.anchorTip.note", { sources, checked })}
      >
        <p className="leading-snug">{t("paid.anchorTip.body", { low, high })}</p>
      </InfoPanel>
    </Tooltip>
  );
}

/**
 * The two founders, with their photos: on the talk-first card and the approval page.
 * `takesCalls`: hosts the call booked through BookingLink, so the talk-first card names only them.
 */
export const FOUNDERS = [
  {
    name: "Simon Orzel",
    firstName: "Simon",
    photo: "/images/people/simon.png",
    takesCalls: true,
  },
  {
    name: "Cory Hisey",
    firstName: "Cory",
    photo: "/images/people/cory.png",
    takesCalls: false,
  },
] as const;

const TALK_FIRST_SIZES = {
  default: {
    card: "gap-3 rounded-xl p-4 sm:gap-4",
    faces: "-space-x-2.5 sm:-space-x-3",
    face: "size-10 sm:size-12",
    title: "",
    body: "text-sm",
    chevron: "size-5",
  },
  // Under "Jetzt starten" on the homepage: a one-line button of the same height, faces and title
  // only.
  button: {
    card: "h-11 gap-2.5 rounded-lg px-3",
    faces: "-space-x-1.5",
    face: "size-7",
    title: "text-[0.9375rem] font-medium",
    body: "hidden",
    chevron: "size-4",
  },
} as const;

/**
 * The way to talk before ordering, beside the order button: one card that is its own link to the
 * booking page (ui-design principle 14), with the founders' faces.
 */
export function TalkFirst({
  size = "default",
  className,
}: {
  size?: keyof typeof TALK_FIRST_SIZES;
  /** To match the button it sits beside, such as the walk home's taller order button. */
  className?: string;
}) {
  const t = useTranslations("pricing.tiers.talkFirst");
  const locale = useLocale();
  const s = TALK_FIRST_SIZES[size];
  const names = new Intl.ListFormat(locale, { type: "disjunction" }).format(
    FOUNDERS.filter((person) => person.takesCalls).map((person) => person.firstName),
  );
  return (
    <div
      className={cn(
        "relative flex items-center border bg-muted/40 transition-colors hover:border-foreground/25 hover:bg-muted/70 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        s.card,
        className,
      )}
    >
      <div className={cn("flex shrink-0", s.faces)}>
        {FOUNDERS.map((person) => (
          <Image
            key={person.name}
            src={person.photo}
            alt={person.name}
            width={96}
            height={96}
            className={cn("rounded-full object-cover ring-2 ring-card", s.face)}
          />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn("font-semibold leading-snug", s.title)}>
          <BookingLink className="after:absolute after:inset-0 focus-visible:outline-none">
            {t("title")}
          </BookingLink>
        </p>
        <p className={cn("leading-snug text-muted-foreground", s.body)}>
          {t("body", { names })}
        </p>
      </div>
      <ChevronRight
        aria-hidden
        className={cn("shrink-0 text-muted-foreground", s.chevron)}
      />
    </div>
  );
}

/** For the buyer whose boss decides: the one-page summary at /pricing/approval, to forward. */
export function ApprovalLink() {
  const t = useTranslations("pricing.tiers");
  return (
    <Link
      href="/pricing/approval"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground"
    >
      <Send className="size-3.5" />
      {t("approvalLink")}
    </Link>
  );
}

/**
 * The order button of the pricing cards and the approval page. Someone without an account registers
 * first, with the page's campaign tags, and comes back to the order page after the sign-up
 * (SignInCard's callbackUrl). Closed without live keys (sandbox, or no Qonto at all, as on a
 * self-hosted instance, which sells nothing), so the button keeps its place.
 */
export function OrderButton({
  orderOpen,
  signedIn,
}: {
  /** Whether /bestellen exists for this visitor (lib/billing/ordering-access.ts). */
  readonly orderOpen: boolean;
  readonly signedIn: boolean;
}) {
  const t = useTranslations("pricing.tiers");
  const locale = useLocale();
  if (!orderOpen) {
    return (
      <Button className="h-12 w-full text-base" size="lg" disabled>
        {t("paid.cta")}
      </Button>
    );
  }
  return (
    <Button className="h-12 w-full text-base" size="lg" asChild>
      {signedIn ? (
        <Link href="/bestellen">{t("paid.cta")}</Link>
      ) : (
        <SignInLink
          query={{
            mode: "register",
            callbackUrl: getPathname({ href: "/bestellen", locale }),
          }}
        >
          {t("paid.cta")}
        </SignInLink>
      )}
    </Button>
  );
}

/** What the paid offer includes. Every line is checked against the code or the AGB (above). */
export function PaidFeatureList() {
  const t = useTranslations("pricing.tiers");
  return (
    <ul className="space-y-3">
      {paidFeatures.map((key) => (
        <FeatureItem key={key} highlighted>
          {key === "unlimited" ? (
            // Who counts as one customer is AGB B1: the customer's own group, not the
            // clients of an MSP or a consultant.
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="cursor-help text-left font-semibold underline decoration-foreground/30 decoration-dotted underline-offset-4 hover:decoration-foreground"
                >
                  {t(`paid.features.${key}`)}
                </button>
              </TooltipTrigger>
              <InfoPanel
                title={t("paid.unlimitedTip.title")}
                icon={<Building2 className="size-4 text-primary" />}
                note={t("paid.unlimitedTip.note")}
              >
                <PanelPoints
                  points={unlimitedPoints.map((point) =>
                    t(`paid.unlimitedTip.points.${point}`),
                  )}
                />
              </InfoPanel>
            </Tooltip>
          ) : (
            t.rich(`paid.features.${key}`, {
              cal: (chunks) => (
                <BookingLink className={externalLink}>{chunks}</BookingLink>
              ),
            })
          )}
        </FeatureItem>
      ))}
    </ul>
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
 * The /pricing tiers: learning on the left, the paid Durchgang in the middle as the obvious choice,
 * self-hosting on the right. The billing page shows them too, until the first invoice.
 */
export function PaidPricingCards({
  orderOpen,
  price,
  listPrice,
  grandfathered,
  grandfatheredPrice,
  signedIn,
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
  /**
   * Whether the visitor is signed in: the order button registers first without it, and the
   * earlier-signup price note is shown only then.
   */
  readonly signedIn: boolean;
}) {
  const t = useTranslations("pricing.tiers");

  const tiers = (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* group/tiers: hovering or focusing the self-host link to the paid tier lights the
          paid card up, without client state. */}
      <div className="group/tiers grid gap-6 lg:grid-cols-[1fr_1.6fr_1fr] lg:items-start">
        <SideTier
          name={t("free.name")}
          description={t("free.description")}
          price={t("free.price")}
          priceSub={t("free.priceSub")}
          cta={
            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/kurse">{t("free.cta")}</Link>
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
              risk: (chunks) => (
                <Link href="/risikobewertung" className={externalLink}>
                  {chunks}
                </Link>
              ),
              structure: (chunks) => (
                <Link href="/strukturanalyse" className={externalLink}>
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
            {/* Half the list price is no longer "the price of a gap analysis". */}
            {grandfathered ? null : <PriceAnchor />}
            <div className="mt-3 flex flex-wrap gap-2">
              {/* On touch the terms line under the button says the same in short. */}
              <MoneyBackBadge />
              {grandfathered ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                  {t("paid.grandfatheredBadge")}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <OrderButton orderOpen={orderOpen} signedIn={signedIn} />
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
            <div className="space-y-3">
              <TalkFirst />
              <ApprovalLink />
            </div>
            <Separator />
            <PaidFeatureList />
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
                    <InfoPanel
                      title={t("selfHost.licences.title")}
                      icon={<Scale className="size-4 text-primary" />}
                    >
                      <dl className="divide-y">
                        {LICENCES.map((licence) => (
                          <div
                            key={licence.key}
                            className="space-y-1 py-2.5 first:pt-0 last:pb-0"
                          >
                            <dt className="font-medium">
                              {licence.spdx ?? t(`selfHost.licences.${licence.key}`)}
                            </dt>
                            {licence.packages.map((name) => (
                              <dd
                                key={name}
                                className="break-all font-mono text-xs text-muted-foreground"
                              >
                                {name}
                              </dd>
                            ))}
                          </div>
                        ))}
                      </dl>
                    </InfoPanel>
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

      {/* Only for someone signed in: a visitor arriving cold would read the earlier price as
          "others pay half" right under the offer. */}
      {signedIn && !grandfathered ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("paid.grandfatheredNote", { price: grandfatheredPrice })}
        </p>
      ) : null}
    </div>
  );

  return <TooltipProvider delayDuration={100}>{tiers}</TooltipProvider>;
}
