import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInLink } from "@/components/auth/SignInLink";
import { GetStarted } from "@/components/GetStarted";
import { MotionProvider } from "@/components/landing/motion";
import { OpenSourceNote } from "@/components/landing/OpenSourceNote";
import { WalkHomeShot } from "@/components/landing/WalkHomeShot";
import { WalkOutcomes } from "@/components/landing/WalkOutcomes";
import { WalkShowcase } from "@/components/landing/WalkShowcase";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNav } from "@/components/PublicNav";
import { TalkFirst } from "@/components/pricing/PaidPricingCards";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ogImages } from "@/lib/og-card";
import { ogSite, pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("landing.guided.meta");
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates("", locale),
    openGraph: {
      type: "website",
      ...ogSite("", locale),
      images: ogImages("home", locale, t("title")),
    },
  };
}

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <MotionProvider>
      <PublicNav />
      <main className="relative min-h-screen overflow-x-clip px-6 pb-24 pt-20 sm:pt-24">
        {/* Navy dot-grid, densest behind the product, dissolving to the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(40 75 99 / 0.06) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(92% 60% at 64% 24%, black 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(92% 60% at 64% 24%, black 0%, transparent 78%)",
          }}
        />

        <div className="mx-auto w-full max-w-6xl">
          {/* Headline: full-width, standing on its own (the logo lives in the nav) */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("guided.eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t.rich("guided.title", {
              blue: (chunks) => <span className="text-primary">{chunks}</span>,
            })}
          </h1>

          {/* Below the headline: pitch column + large frameless product */}
          {/* items-start, not center: the pitch column is shorter than the
              screenshot, so centring floated it and left the subtitle starting
              below the top of the image. */}
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,25rem)_1fr] lg:items-start">
            {/* One reader, the company doing its own NIS2: no second door (the supplier portal)
                above the fold to pull them away. */}
            <div>
              <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
                {t("guided.subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-start gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
                >
                  <SignInLink query={{ mode: "register" }}>{t("guided.cta")}</SignInLink>
                </Button>
                {/* A call with us, next to starting alone. */}
                <TalkFirst size="button" />
                <Button
                  asChild
                  variant="link"
                  size="lg"
                  className="group h-auto min-h-11 justify-start whitespace-normal px-0 py-2 text-left has-[>svg]:px-0 text-[0.9375rem] font-medium text-foreground/80 hover:text-foreground hover:no-underline"
                >
                  <Link href="/training/nis2-ceo">
                    {t("guided.trainingCta")}
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Product: large, frameless, floating screenshot */}
            <WalkHomeShot preload video />
          </div>
        </div>

        {/* Programme logos, first thing under the hero. Every logo goes to
            /partner rather than out to the programme, so the strip reads as one
            claim about us instead of seven outbound links. */}
        <section className="mx-auto mt-10 w-full max-w-6xl sm:mt-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("partnersLabel")}
          </p>
          <div className="mt-6">
            <PartnerLogoStrip variant="landing" />
          </div>
        </section>

        {/* What the walk leaves behind first, then the walk screen by screen, then the same one way in. */}
        <WalkOutcomes />
        <WalkShowcase />
        <GetStarted variant="landing" className="mt-24 sm:mt-32" />

        {/* Open source, after the close: aligned to the hero's left edge under a
            hairline, so it reads as a footnote to the offer rather than a second pitch. */}
        <section className="mx-auto mt-16 w-full max-w-6xl border-t border-border/60 pt-10">
          <OpenSourceNote className="max-w-2xl" />
        </section>
      </main>
      <PublicFooter />
    </MotionProvider>
  );
}
