import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";
import { Art, SETUP_ART } from "@/components/durchgang/Art";
import { BookingLink } from "@/components/pricing/BookingLink";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const QUIET_LINK =
  "inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * The one way in, and the last thing on every public page that asks for something: the landing
 * page, /about and every wiki article. One ask everywhere, so a reader never weighs a scope check
 * against a request form against a sign-up. A finished course ends on it too, pointing a reader
 * who is already signed in straight at the walk.
 *
 * `landing` closes the landing page, whose reader has just seen the walk screen by screen.
 * `funnel` is for a page a reader enters from search and never saw the landing page: it repeats
 * the landing page's headline and subline, so the ask carries its own reason, and offers a call
 * as the quieter way for a reader who wants to talk before signing up.
 */
export async function GetStarted({
  variant,
  className,
  href = "/auth/signin",
}: {
  variant: "landing" | "funnel";
  className?: string;
  href?: ComponentProps<typeof Link>["href"];
}) {
  const t = await getTranslations("landing");

  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-6xl items-center justify-between gap-10 rounded-3xl bg-primary/[0.06] px-6 py-12 sm:px-12 sm:py-16",
        className,
      )}
    >
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {variant === "landing"
            ? t("walk.closing")
            : t.rich("guided.title", {
                blue: (chunks) => <span className="text-primary">{chunks}</span>,
              })}
        </h2>
        {variant === "funnel" && (
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("guided.subtitle")}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Button
            asChild
            size="lg"
            className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
          >
            <Link href={href}>{t("guided.cta")}</Link>
          </Button>
          <Link href="/pricing" className={QUIET_LINK}>
            {t("walk.pricing")}
          </Link>
          {variant === "funnel" && (
            <BookingLink className={QUIET_LINK}>{t("walk.talkFirst")}</BookingLink>
          )}
        </div>
      </div>
      {/* Setting up the company, the walk's step right after the registration. */}
      <Art src={SETUP_ART} className="hidden h-40 shrink-0 sm:block lg:h-48" />
    </section>
  );
}
