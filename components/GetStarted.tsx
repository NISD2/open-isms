import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";
import { SignInLink } from "@/components/auth/SignInLink";
import { Art, SETUP_ART } from "@/components/durchgang/Art";
import { MotionProvider } from "@/components/landing/motion";
import { WalkHomeShot } from "@/components/landing/WalkHomeShot";
import { TalkFirst } from "@/components/pricing/PaidPricingCards";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const QUIET_LINK =
  "inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline";

const SECTION =
  "mx-auto w-full max-w-6xl rounded-3xl bg-primary/[0.06] px-6 py-12 sm:px-12 sm:py-16";

type Href = ComponentProps<typeof Link>["href"];

/**
 * The one way in, and the last thing on every public page that asks for something: the landing
 * page, /about and every wiki article. One ask everywhere, so a reader never weighs a scope check
 * against a request form against a sign-up. A finished course ends on it too, pointing a reader
 * who is already signed in straight at the walk.
 *
 * `landing` closes the landing page, whose reader has just seen the walk screen by screen.
 * `funnel` is for a page a reader enters from search and never saw the landing page: it repeats
 * the landing page's hero, headline, subline and the walk's home moving, so the ask shows what
 * the button opens and the button can go straight to the registration. A call is offered beside
 * it for a reader who wants to talk before signing up.
 */
export async function GetStarted({
  variant,
  className,
  href,
}: {
  variant: "landing" | "funnel";
  className?: string;
  /**
   * Where the button goes for a reader who is signed in. Without it: the registration form, with
   * the page's campaign tags.
   */
  href?: Href;
}) {
  return variant === "funnel" ? (
    <FunnelAsk className={className} href={href} />
  ) : (
    <ClosingAsk className={className} href={href} />
  );
}

async function StartButton({ href }: { href?: Href }) {
  const t = await getTranslations("landing.guided");
  return (
    <Button
      asChild
      size="lg"
      className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
    >
      {href ? (
        <Link href={href}>{t("cta")}</Link>
      ) : (
        <SignInLink query={{ mode: "register" }}>{t("cta")}</SignInLink>
      )}
    </Button>
  );
}

async function PricingLink() {
  const t = await getTranslations("landing.walk");
  return (
    <Link href="/pricing" className={QUIET_LINK}>
      {t("pricing")}
    </Link>
  );
}

async function FunnelAsk({ className, href }: { className?: string; href?: Href }) {
  const t = await getTranslations("landing.guided");
  return (
    // On a phone it stands on the page like the landing hero, under a hairline: inside the box's
    // padding the German call button no longer fits on one line.
    <section
      className={cn(
        SECTION,
        "max-sm:rounded-none max-sm:border-t max-sm:border-border/60 max-sm:bg-transparent max-sm:px-0",
        className,
      )}
    >
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {t.rich("title", {
          blue: (chunks) => <span className="text-primary">{chunks}</span>,
        })}
      </h2>
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,25rem)_1fr] lg:items-start">
        <div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <StartButton href={href} />
            <TalkFirst size="button" />
            <PricingLink />
          </div>
        </div>
        {/* Its own pause switch: the page around it may have no moving screenshots of its own. */}
        <MotionProvider>
          <WalkHomeShot />
        </MotionProvider>
      </div>
    </section>
  );
}

async function ClosingAsk({ className, href }: { className?: string; href?: Href }) {
  const t = await getTranslations("landing.walk");
  return (
    <section
      className={cn(SECTION, "flex items-center justify-between gap-10", className)}
    >
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t("closing")}
        </h2>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <StartButton href={href} />
          <PricingLink />
        </div>
      </div>
      {/* Setting up the company, the walk's step right after the registration. */}
      <Art src={SETUP_ART} className="hidden h-40 shrink-0 sm:block lg:h-48" />
    </section>
  );
}
