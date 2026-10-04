import {
  BookOpen,
  ChevronRight,
  type LucideIcon,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";
import {
  ApprovalLink,
  MoneyBackBadge,
  PaidFeatureList,
  PriceAnchor,
  TalkFirst,
} from "@/components/pricing/PaidPricingCards";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { formatWholeEuro, GRANDFATHERED_NET_CENTS } from "@/lib/billing/order";
import { api } from "@/lib/trpc/server";

/**
 * A portal that needs no order, as one card that is its own link (ui-design principle 14): the
 * link sits on the title and stretches over the card, so a screen reader names the card by its
 * title and the chevron says at rest, on a phone too, that it leads somewhere.
 */
function DoorCard({
  href,
  icon: Icon,
  title,
  body,
}: {
  readonly href: ComponentProps<typeof Link>["href"];
  readonly icon: LucideIcon;
  readonly title: string;
  readonly body: string;
}) {
  return (
    <div className="relative flex items-start gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/25 hover:bg-muted/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="font-semibold leading-snug">
          <Link
            href={href}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <ChevronRight
        aria-hidden
        className="mt-2.5 size-5 shrink-0 text-muted-foreground"
      />
    </div>
  );
}

/**
 * What a free account sees when it opens a paid portal page, with the sidebar still beside it: the
 * Compliance Portal with its price and the way to order it, or the two portals that need no order.
 * The cards carry the portal switcher's icons, so each one is recognisable where it leads.
 */
export async function PortalOffer() {
  const [t, tiers, supplier, training, locale, status] = await Promise.all([
    getTranslations("billing.offer"),
    getTranslations("pricing.tiers"),
    getTranslations("supplierPortal.nav"),
    getTranslations("trainingPortal"),
    getLocale(),
    api.billing.status(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">{t("lead")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <section
          aria-labelledby="offer-paid"
          className="space-y-6 rounded-xl border-2 border-primary bg-card p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <h2 id="offer-paid" className="flex items-center gap-2 font-semibold text-xl">
              <Shield className="size-5 text-primary" />
              {t("paidName")}
            </h2>
            <p className="text-muted-foreground">{tiers("paid.description")}</p>
          </div>
          <div className="space-y-3">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-bold text-5xl tracking-tight">
                {formatWholeEuro(status.netCents, locale)}
              </span>
              <span className="text-muted-foreground text-sm">
                {tiers("paid.priceSub")}
              </span>
            </p>
            {/* As on /pricing: half the list price is no longer "the price of a gap analysis". */}
            {status.netCents === GRANDFATHERED_NET_CENTS ? null : <PriceAnchor />}
            <div>
              <MoneyBackBadge />
            </div>
          </div>
          <div className="space-y-3">
            {/* Closed without live keys: on nisd2.eu while they are broken, or in a sandbox run
                for anyone but a platform admin. */}
            {status.open ? (
              <Button className="h-12 w-full text-base" size="lg" asChild>
                <Link href="/bestellen">{tiers("paid.cta")}</Link>
              </Button>
            ) : (
              <Button className="h-12 w-full text-base" size="lg" disabled>
                {tiers("paid.cta")}
              </Button>
            )}
            <p className="text-muted-foreground text-xs leading-relaxed">
              {tiers("paid.terms")}{" "}
              <Link
                href="/terms"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {tiers("paid.termsLink")}
              </Link>
            </p>
          </div>
          <div className="space-y-3">
            <TalkFirst />
            <ApprovalLink />
          </div>
          <Separator />
          <PaidFeatureList />
        </section>

        {/* order-first: on a phone the paid card's feature list would push both doors off the
            first screen, and they are as much an answer to the question as the order is. */}
        <section
          aria-labelledby="offer-free"
          className="order-first space-y-3 lg:order-none"
        >
          <h2 id="offer-free" className="font-medium text-muted-foreground text-sm">
            {t("withoutOrder")}
          </h2>
          <DoorCard
            href="/portal/supplier"
            icon={ShieldCheck}
            title={supplier("portalName")}
            body={t("supplier")}
          />
          <DoorCard
            href="/training/courses"
            icon={BookOpen}
            title={training("title")}
            body={t("training")}
          />
        </section>
      </div>
    </div>
  );
}
