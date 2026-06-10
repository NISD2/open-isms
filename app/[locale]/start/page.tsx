import { getTranslations } from "next-intl/server";
import {
  ClipboardCheck,
  FileCheck,
  Clock,
  Building2,
  Check,
  X,
  AlertTriangle,
  Users,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FunnelFaq } from "@/components/funnel/FunnelFaq";
import { CalBooker } from "@/components/funnel/CalBooker";

const badAlternatives = ["consultants", "enterprise", "usPlatforms"] as const;

const featureCards = [
  { key: "obligations", icon: ClipboardCheck },
  { key: "evidence", icon: FileCheck },
  { key: "deadlines", icon: Clock },
  { key: "bsiRegistration", icon: Building2 },
] as const;

const statIcons = [Users, AlertTriangle, Scale] as const;
const statKeys = ["companies", "penalty", "liability"] as const;

export default async function FunnelPage() {
  const t = await getTranslations("funnel");

  return (
    <main className="px-6 pb-24 lg:px-0">
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
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-4xl py-16 sm:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("stats.heading")}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {statKeys.map((stat, i) => {
            const Icon = statIcons[i];
            return (
              <div
                key={stat}
                className="rounded-xl border bg-card p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {t(`stats.${stat}`)}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`stats.${stat}Label`)}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
          {t("stats.description")}
        </p>
      </section>

      {/* Alternatives */}
      <section className="mx-auto max-w-4xl py-16 sm:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("alternatives.heading")}
        </h2>

        {/* Bad options */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {badAlternatives.map((card) => (
            <div
              key={card}
              className="rounded-xl border border-destructive/20 bg-destructive/5 p-6"
            >
              <div className="flex items-center gap-2 line-through opacity-70">
                <X className="h-4 w-4 shrink-0 text-destructive" />
                <span className="font-semibold text-foreground">
                  {t(`alternatives.${card}.title`)}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-destructive">
                {t(`alternatives.${card}.price`)}
              </p>
              <ul className="mt-4 space-y-2">
                {(t.raw(`alternatives.${card}.items`) as string[]).map(
                  (item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <X className="mt-0.5 h-3 w-3 shrink-0 text-destructive/50" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* NISD2.eu — the winner */}
        <div className="mt-6 rounded-xl border-2 border-primary bg-primary/5 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">
              {t("alternatives.nisd2.title")}
            </span>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(t.raw("alternatives.nisd2.items") as string[]).map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-primary">
            {t("alternatives.callout")}
          </p>
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

      {/* Offer */}
      <section className="mx-auto max-w-4xl py-16 sm:py-24">
        <div className="overflow-hidden rounded-2xl bg-primary shadow-lg">
          <div className="p-8 text-primary-foreground sm:p-12">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              {t("offer.heading")}
            </h2>
            <p className="mt-3 text-center opacity-80">
              {t("offer.subtitle")}
            </p>
            <div className="mx-auto mt-10 max-w-lg rounded-xl bg-white/10 p-6 backdrop-blur-sm">
              <ul className="space-y-4">
                {(t.raw("offer.items") as string[]).map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-8 text-center text-sm opacity-70">
              {t("offer.exchange")}
            </p>
            <div className="mt-6 text-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-primary shadow-md hover:bg-white/90"
              >
                <a href="#book">{t("offer.cta")}</a>
              </Button>
            </div>
          </div>
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

      {/* Book a Demo — Embedded Cal.com */}
      <section
        id="book"
        className="mx-auto max-w-4xl scroll-mt-16 py-16 sm:py-24"
      >
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
    </main>
  );
}
