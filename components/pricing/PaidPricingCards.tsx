import {
  Building2,
  Check,
  ChevronRight,
  FileText,
  Info,
  Receipt,
  Send,
  Shield,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
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
import { cn } from "@/lib/utils";
import { BookingLink } from "./BookingLink";
import { callHostNames, FOUNDERS } from "./founders";
import { gapAnalysisRange } from "./gap-analysis-prices";

// Every line is checked against the code or the AGB. "Deadlines and reminders" means the in-app
// reminders the nightly cron schedules; deadline digests by email go out only when an operator
// presses send (lib/mail/digest-outbox.ts), so the list does not promise email. "MCP server" is
// paid only: the consent page, Settings and every MCP request check mayWalkDurchgang, and the
// assistant cannot finish or approve an item (lib/mcp).
const freeFeatures = ["courses", "wiki", "tools", "selfHost"] as const;
const paidFeatures = [
  "guided",
  "mcp",
  "unlimited",
  "history",
  "deadlines",
  "suppliers",
  "export",
  "updates",
] as const;

const PAID_CARD_ID = "durchgang";

// Wiki pages join the routing table at runtime (wikiPathnames), so their paths are missing from
// the typed list of static routes; the routing still translates this one per locale.
type Href = ComponentProps<typeof Link>["href"];
const MCP_WIKI_PAGE = "/wiki/ki-assistenten/was-der-assistent-ausfuellt" as Href;

const moneyBackPoints = ["first", "cancel", "refund", "data"] as const;
const unlimitedPoints = ["structure", "users", "payment"] as const;

const externalLink =
  "underline decoration-primary/30 underline-offset-4 hover:decoration-primary";

/** A `t.rich` tag that links its text, as the feature lines do. */
const linkTo = (href: Href) => (chunks: ReactNode) => (
  <Link href={href} className={externalLink}>
    {chunks}
  </Link>
);

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
  calLink,
}: {
  size?: keyof typeof TALK_FIRST_SIZES;
  /** An instance's own CAL_LINK; absent, the booking link's default calendar. */
  calLink?: string;
  /** To match the button it sits beside, such as the walk home's taller order button. */
  className?: string;
}) {
  const t = useTranslations("pricing.tiers.talkFirst");
  const locale = useLocale();
  const s = TALK_FIRST_SIZES[size];
  const names = callHostNames(locale);
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
          <BookingLink
            calLink={calLink}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
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
          ) : key === "mcp" ? (
            t.rich("paid.features.mcp", { mcp: linkTo(MCP_WIKI_PAGE) })
          ) : (
            t(`paid.features.${key}`)
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
 * The /pricing tiers: learning and the paid Durchgang as two equal cards built the same way,
 * self-hosting as one line under both. The billing page shows them too, until the first invoice.
 */
export function PaidPricingCards({
  orderOpen,
  price,
  monthlyPrice,
  monthlyListPrice,
  grandfathered,
  signedIn,
}: {
  /** Whether /bestellen exists for this visitor (lib/billing/ordering-access.ts). */
  readonly orderOpen: boolean;
  /** The yearly net price this visitor would be invoiced. */
  readonly price: string;
  /** `price` per month (lib/billing/order.ts monthlyNetCents), the large figure on the card. */
  readonly monthlyPrice: string;
  /** The public price per month, struck through when the visitor pays less. */
  readonly monthlyListPrice: string;
  /** Whether this visitor is a grandfathered account holder (AGB B4). */
  readonly grandfathered: boolean;
  /** Whether the visitor is signed in: the order button registers first without it. */
  readonly signedIn: boolean;
}) {
  const t = useTranslations("pricing.tiers");

  const tiers = (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="grid gap-6 lg:grid-cols-2">
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
              course: linkTo("/training/nis2-ceo"),
              risk: linkTo("/risikobewertung"),
              structure: linkTo("/strukturanalyse"),
              selfHost: linkTo("/open-source"),
            }),
          }))}
        />

        {/* order-first: the offer is the first card, on the left and on top of a phone (Simon,
            19.10.2026). Built like the learning card beside it, same type sizes and order (name,
            price, action, what is included), so the two read as one table; the border and the
            site's mark before the name set the offer apart. No "recommended" badge (one offer).
            Under the order button only the call; the approval page is linked from the FAQ. */}
        <Card
          id={PAID_CARD_ID}
          className="order-first h-full scroll-mt-24 border-2 border-primary shadow-sm"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {/* The nav's mark, smaller. */}
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary"
              >
                <Shield className="size-3.5 text-primary-foreground" />
              </span>
              {t("paid.name")}
            </CardTitle>
            <CardDescription>{t("paid.description")}</CardDescription>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {grandfathered ? (
                <span className="text-lg text-muted-foreground line-through decoration-2">
                  {monthlyListPrice}
                </span>
              ) : null}
              <span className="text-4xl font-semibold tracking-tight">
                {monthlyPrice}
              </span>
              <span className="text-sm text-muted-foreground">{t("paid.perMonth")}</span>
            </div>
            {/* The month is how it reads; the year is what is invoiced, so it stands right under. */}
            <p className="text-sm text-muted-foreground">
              {t("paid.billedYearly", { price })}
            </p>
            {/* Half the list price is no longer "the price of a gap analysis". */}
            {grandfathered ? null : <PriceAnchor />}
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Its details are in the tooltip; the order page repeats the terms before anyone
                  orders, so the card carries no terms line of its own (Simon, 19.10.2026). */}
              <MoneyBackBadge />
              {grandfathered ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                  {t("paid.grandfatheredBadge")}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order and the call side by side, the call in the homepage hero's one-line form;
                stacked on a phone. */}
            <div className="grid gap-3 sm:grid-cols-2">
              <OrderButton orderOpen={orderOpen} signedIn={signedIn} />
              <TalkFirst size="button" className="h-12 w-full" />
            </div>
            <Separator />
            <PaidFeatureList />
          </CardContent>
        </Card>
      </div>

      {/* Only the terms here: "by invoice" is under the order button, and self-hosting is a
          line of the Self Serve card (Simon, 19.10.2026). */}
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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
      </p>
    </div>
  );

  return <TooltipProvider delayDuration={100}>{tiers}</TooltipProvider>;
}
