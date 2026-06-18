import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  ClipboardCheck,
  FileCheck,
  Clock,
  Building2,
  Check,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FunnelFaq } from "@/components/funnel/FunnelFaq";
import { CalBooker } from "@/components/funnel/CalBooker";

const processSteps = [
  { key: "step1", icon: Clock },
  { key: "step2", icon: Users },
  { key: "step3", icon: Check },
] as const;

const comparisonItems = ["consultants", "fullService", "intlPlatforms"] as const;

const featureCards = [
  { key: "obligations", icon: ClipboardCheck },
  { key: "evidence", icon: FileCheck },
  { key: "deadlines", icon: Clock },
  { key: "bsiRegistration", icon: Building2 },
] as const;

export default async function FunnelPage() {
  // NL copy for this funnel is not authored yet; keep the locale off the page
  // until a Dutch pass rather than showing English on a Dutch page.
  const locale = await getLocale();
  if (locale === "nl") redirect("/nl");

  const t = await getTranslations("funnel");

  return (
    <div className="px-6 pb-24 lg:px-0">
      {/* Hero */}
      <section className="mx-auto max-w-4xl pt-16 text-center sm:pt-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("hero.headline")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("hero.subhead")}
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <a href="#book">{t("hero.cta")}</a>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{t("hero.trust")}</p>
        <p className="mt-3 text-sm">
          <Link
            href={"/wiki/umsetzung/nis2-roadmap" as never}
            className="inline-flex items-center gap-1 text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {t("hero.roadmapLink")}
            <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-4xl py-16 sm:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("process.heading")}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {processSteps.map(({ key, icon: Icon }) => (
            <div key={key} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{t(`process.${key}Title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`process.${key}Body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-4xl py-16 sm:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("comparison.heading")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("comparison.intro")}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {comparisonItems.map((key) => (
            <div key={key} className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">{t(`comparison.${key}Title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`comparison.${key}`)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border-2 border-primary bg-primary/5 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold">{t("comparison.nisd2Title")}</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{t("comparison.nisd2")}</p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl py-16 sm:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("features.heading")}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {featureCards.map(({ key, icon: Icon }) => (
            <div key={key} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{t(`features.${key}.title`)}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl py-16 sm:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("faq.heading")}
        </h2>
        <div className="mt-12">
          <FunnelFaq />
        </div>
      </section>

      {/* Book a call */}
      <section id="book" className="mx-auto max-w-4xl scroll-mt-16 py-16 sm:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("finalCta.headline")}
        </h2>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("finalCta.email")}
        </p>
        <div className="mt-8">
          <CalBooker calLink="sorzel/work" />
        </div>
      </section>

      {/* Sources */}
      <section className="mx-auto max-w-3xl">
        <p className="text-center text-xs leading-relaxed text-muted-foreground/70">
          {t("sources.body")}
        </p>
      </section>
    </div>
  );
}
