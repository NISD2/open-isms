import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Code2,
  FileBadge,
  Handshake,
  ListChecks,
  Lock,
  Megaphone,
  Server,
  UserPlus,
} from "lucide-react";
import { supplierQuestionnaire } from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { pageAlternates } from "@/lib/seo";
import { ogImages } from "@/lib/og-card";

/**
 * Question count comes from the published questionnaire schema, so the copy
 * cannot drift from the form a supplier actually fills in.
 */
const QUESTION_COUNT = supplierQuestionnaire.fields.length;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("supplierPortal.marketing");
  const title = t("metaTitle");
  return {
    title,
    description: t("metaDescription"),
    alternates: pageAlternates("supplier-portal", locale),
    openGraph: {
      type: "website",
      images: ogImages("supplier-portal", locale, title),
    },
  };
}

export default async function SupplierPortalLandingPage() {
  const t = await getTranslations("supplierPortal.marketing");
  const locale = await getLocale();

  const steps = [
    { icon: UserPlus, title: t("step1Title"), body: t("step1Body") },
    {
      icon: ClipboardList,
      title: t("step2Title"),
      body: t("step2Body", { count: QUESTION_COUNT }),
    },
    { icon: Handshake, title: t("step3Title"), body: t("step3Body") },
    { icon: Megaphone, title: t("step4Title"), body: t("step4Body") },
  ];

  const covers = [
    { icon: Building2, title: t("covers1Title"), body: t("covers1Body") },
    { icon: ListChecks, title: t("covers2Title"), body: t("covers2Body") },
    { icon: FileBadge, title: t("covers3Title"), body: t("covers3Body") },
    { icon: Server, title: t("covers4Title"), body: t("covers4Body") },
    { icon: Check, title: t("covers5Title"), body: t("covers5Body") },
  ];

  return (
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
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          {t.rich("title", {
            blue: (chunks) => <span className="text-primary">{chunks}</span>,
          })}
        </h1>

        {/* Below the headline: pitch column + large frameless product */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,25rem)_1fr] lg:items-center">
          <div>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
              {t.rich("subtitle", {
                os: (chunks) => (
                  <a
                    href="https://github.com/NISD2/open-isms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>

            <div className="mt-8 flex flex-col items-start gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
              >
                <Link href="/auth/signin">{t("ctaPrimary")}</Link>
              </Button>
              <Button
                asChild
                variant="link"
                size="lg"
                className="group h-11 px-0 text-[0.9375rem] font-medium text-foreground/80 hover:text-foreground hover:no-underline"
              >
                <Link href="/nis2-lieferanten-fragebogen">
                  {t("ctaSecondary")}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>

            {/* Quiet meta row: entity door + legal citation. Mirror image of
                the supplier door on the landing page. */}
            <div className="mt-8 max-w-sm border-t border-border/60 pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <Link
                  href="/applicability"
                  className="font-medium text-foreground/70 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/40"
                >
                  {t("entityDoor")}
                </Link>
              </p>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/60">
                <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
                {t("regLine")}
              </p>
            </div>
          </div>

          {/* Product: large, frameless, floating screenshot. Per-locale shot
              generated by the NIS2 private tool, same pipeline as the
              landing-page journey hero. */}
          <div
            className="rounded-xl"
            style={{ boxShadow: "0 40px 80px -20px rgb(40 75 99 / 0.28)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/supplier-hero-${locale}.png`}
              alt={t("screenshotAlt")}
              className="block w-full rounded-xl border border-border/60"
            />
          </div>
        </div>
      </div>

      {/* How it works: the four things a supplier actually does here. */}
      <section className="mx-auto mt-20 w-full max-w-6xl border-t border-border/60 pt-10 sm:mt-24">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("howTitle")}
        </h2>
        <ol className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex flex-col gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-base font-medium">
                  <span className="mr-2 text-muted-foreground/60">{i + 1}</span>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* What the questionnaire asks, and where the structure comes from. */}
      <section className="mx-auto mt-20 w-full max-w-6xl border-t border-border/60 pt-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("coversTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("coversIntro")}
            </p>
            <a
              href="https://github.com/NISD2/nis2-supply-chain-questionnaire-schema"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              nis2-supply-chain-questionnaire-schema
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {covers.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title}>
                  <dt className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-primary" />
                    {item.title}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* Privacy posture + why the platform is free. */}
      <section className="mx-auto mt-20 w-full max-w-6xl border-t border-border/60 pt-10">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              {t("privacyTitle")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("privacyBody")}
            </p>
            <blockquote className="mt-8 border-l-2 border-primary/30 pl-5">
              <p className="text-base italic leading-relaxed text-foreground/90">
                „{t("bsiQuote")}"
              </p>
              {t("bsiQuoteTranslation") && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("bsiQuoteTranslation")}
                </p>
              )}
              <footer className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
                {t("bsiAttribution")}
              </footer>
            </blockquote>
          </div>
          <div className="lg:border-l lg:border-border/60 lg:pl-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("whyFreeTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("whyFree")}
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
              {t("trustLink")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl border-t border-border/60 pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("footerHeadline")}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("footerBody")}
        </p>
        <Button
          asChild
          size="lg"
          className="mt-6 h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
        >
          <Link href="/auth/signin">{t("footerCta")}</Link>
        </Button>
      </section>
    </main>
  );
}
