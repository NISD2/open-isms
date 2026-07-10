import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Check, Code2, Server, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { pageAlternates } from "@/lib/seo";
import { ogImages } from "@/lib/og-card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isDE = locale === "de";
  const isNL = locale === "nl";
  return {
    title: isDE
      ? "Kostenlose NIS 2 Plattform: Gap-Analyse, Vorlagen, Training"
      : isNL
        ? "Gratis NIS 2 platform: gap assessment, sjablonen, training"
        : "Free NIS 2 platform: gap assessment, templates, training",
    description: isDE
      ? "Selbsteinschätzung mit 116 Fragen, Vorlagen für § 30 BSIG und Artikel 21 NIS 2, BSI-Registrierung und Schulung der Geschäftsführung. Open Source, kein Lock-in."
      : isNL
        ? "Zelfbeoordeling met 116 vragen, sjablonen voor Artikel 21 NIS 2, registratiehulp en bestuurstraining. Open source, geen lock-in."
        : "Self-assessment with 116 questions, templates for Article 21 NIS 2, BSI registration guide, and management training. Open Source, no lock-in.",
    alternates: pageAlternates("", locale),
    openGraph: {
      type: "website",
      images: ogImages("home", locale, "nisd2.eu: kostenlose NIS 2 Plattform"),
    },
  };
}

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const locale = await getLocale();
  // NL roadmap copy is not authored yet; send the NL "start" CTA to sign-in
  // rather than the not-yet-localised roadmap.
  const ctaStartHref =
    locale === "nl" ? "/auth/signin" : "/wiki/umsetzung/nis2-roadmap";

  return (
    <>
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
            maskImage:
              "radial-gradient(92% 60% at 64% 24%, black 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(92% 60% at 64% 24%, black 0%, transparent 78%)",
          }}
        />

        <div className="mx-auto w-full max-w-6xl">
          {/* Headline: full-width, standing on its own (the logo lives in the nav) */}
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t.rich("title", {
              blue: (chunks) => <span className="text-primary">{chunks}</span>,
            })}
          </h1>

          {/* Below the headline: pitch column + large frameless product */}
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,25rem)_1fr] lg:items-center">
            <div>
              <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
                {t("subtitle")}
              </p>

              {/* CTAs stacked for the narrow column */}
              <div className="mt-8 flex flex-col items-start gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link href="/training/nis2-ceo">{t("startTraining")}</Link>
                </Button>
                <Button
                  asChild
                  variant="link"
                  size="lg"
                  className="group h-11 px-0 text-[0.9375rem] font-medium text-foreground/80 hover:text-foreground hover:no-underline"
                >
                  <Link href={ctaStartHref as never}>
                    {t("ctaStart")}
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>

              {/* Quiet meta row: supplier door + legal citation */}
              <div className="mt-8 max-w-sm border-t border-border/60 pt-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <Link
                    href="/portal/supplier"
                    className="font-medium text-foreground/70 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/40"
                  >
                    {t("supplierDoor")}
                  </Link>
                </p>
                <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/60">
                  <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
                  {t("regLine")}
                </p>
              </div>
            </div>

            {/* Product: large, frameless, floating screenshot */}
            <div
              className="rounded-xl"
              style={{ boxShadow: "0 40px 80px -20px rgb(40 75 99 / 0.28)" }}
            >
              {/* Per-locale product shot (generated by the NIS2 private
                  tool). Falls back to the DE image via journey-hero.png. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/journey-hero-${locale}.png`}
                alt="nisd2.eu Journey"
                className="block w-full rounded-xl border border-border/60"
              />
            </div>
          </div>
        </div>

        {/* Below the hero: what you get + why free. Aligned to the hero
            width and left edge, split by a hairline, so it reads as an
            intentional section rather than a floating centered card. */}
        <section className="mx-auto mt-20 w-full max-w-6xl border-t border-border/60 pt-10 sm:mt-24">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("cardGetTitle")}
              </p>
              <ul className="mt-5 grid gap-5 sm:grid-cols-3">
                <li className="flex flex-col gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-snug">{t("cardGet1")}</span>
                </li>
                <li className="flex flex-col gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-snug">{t("cardGet2")}</span>
                </li>
                <li className="flex flex-col gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-snug">{t("cardGet3")}</span>
                </li>
              </ul>
            </div>
            <div className="lg:border-l lg:border-border/60 lg:pl-16">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("cardWhyFreeTitle")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("cardWhyFree")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href="https://github.com/NISD2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {t("proofOpenSource")}
                </a>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
                  <Server className="h-3.5 w-3.5" />
                  {t("proofEuHosted")}
                </span>
              </div>
              <Link
                href="/vertrauen"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {t("cardTrustLink")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
