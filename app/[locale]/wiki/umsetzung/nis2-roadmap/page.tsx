import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Compass,
  Clock,
  Check,
  CalendarClock,
  User,
} from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PrintShareActions } from "./PrintShareActions";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("nis2Roadmap.meta.title");
  const description = t("nis2Roadmap.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-roadmap", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-roadmap",
      locale,
      title: t("nis2Roadmap.meta.ogTitle"),
      description: t("nis2Roadmap.meta.ogDescription"),
      type: "article",
    }),
  };
}

const stepKeys = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;
type StepKey = (typeof stepKeys)[number];

const PERSONAL_STEP: StepKey = "step3";

export default async function Nis2RoadmapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info.nis2Roadmap");

  const steps = stepKeys.map((key) => ({
    key,
    title: t(`${key}.title`),
    law: t(`${key}.law`),
    owner: t(`${key}.owner`),
    time: t(`${key}.time`),
    deadline: t(`${key}.deadline`),
    what: t(`${key}.what`),
    actionText: t(`${key}.actionText`),
    actionHref: t(`${key}.actionHref`),
    isPersonal: key === PERSONAL_STEP,
  }));

  // Primary action: the platform runs this exact roadmap as a guided journey.
  // Auth is expected here (the user is choosing to enter the app), unlike a
  // cold landing CTA, so linking straight to /journey is fine.
  const platformCta = (
    <Card className="border-primary/30 bg-primary/5 print:hidden">
      <CardContent className="py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-lg font-semibold text-primary">
            <Compass className="size-5" />
            {t("platform.heading")}
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">{t("platform.body")}</p>
        </div>
        <Link
          href={"/journey" as never}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          {t("platform.cta")}
          <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );

  // Compact repeat for the bottom: same button, no duplicated pitch copy.
  const platformCtaCompact = (
    <Card className="border-primary/30 bg-primary/5 print:hidden">
      <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Compass className="size-4" />
          {t("platform.compact")}
        </div>
        <Link
          href={"/journey" as never}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          {t("platform.cta")}
          <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10 print:space-y-4">
      <WikiPageJsonLd
        category="umsetzung"
        slug="nis2-roadmap"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Compliance-Beauftragte"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["nis2"]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: t("heroTitle"),
          description: t("heroSubtitle"),
          totalTime: "PT3H",
          step: steps.map((step, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: step.title,
            text: step.what,
          })),
        }}
      />

      {/* Hero */}
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border print:hidden">
          <Compass className="size-3.5 text-primary" />
          {t("heroBadge")}
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-primary">
          {t("heroTitle")}
        </h1>
        <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground">
          {t("heroSubtitle")}
        </p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      {/* Primary action: run this roadmap as a guided journey in the platform */}
      {platformCta}

      {/* Triage line */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <span className="font-semibold">{t("triageHeading")}</span>{" "}
          <span className="text-muted-foreground">{t("triageBody")}</span>
        </div>
        <Link
          href={"/applicability" as never}
          className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
        >
          {t("triageCta")}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Steps: one calm card, six journey-style rows */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-primary">
          {t("stepsHeading")}
        </h2>
        <Card className="overflow-hidden rounded-xl border-border/60 bg-card shadow-sm">
          <CardContent className="space-y-1 p-2">
            {steps.map((step, i) => {
              const isExternal = step.actionHref.startsWith("http");
              return (
                <div
                  key={step.key}
                  className={
                    step.isPersonal
                      ? "flex flex-col gap-3 rounded-lg bg-primary/[0.05] px-3 py-3 ring-1 ring-inset ring-primary/25 sm:flex-row sm:items-start"
                      : "flex flex-col gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-start"
                  }
                >
                  {/* Numbered marker */}
                  <span
                    className={
                      step.isPersonal
                        ? "grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-4 ring-primary/15"
                        : "grid size-7 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
                    }
                  >
                    {i + 1}
                  </span>

                  {/* Title + one-line what + owner */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium">{step.title}</span>
                      <span
                        className={
                          step.isPersonal
                            ? "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/25"
                            : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border"
                        }
                      >
                        {step.isPersonal ? (
                          <ShieldCheck className="size-3" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        {step.isPersonal ? t("personalBadge") : t("delegableBadge")}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{step.what}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <User className="size-3 shrink-0" />
                      <span className="truncate">
                        <span className="text-muted-foreground/70">{t("ownerLabel")}:</span>{" "}
                        {step.owner}
                      </span>
                    </div>
                  </div>

                  {/* Right-aligned compact meta cluster */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:flex-col sm:items-end sm:gap-1.5">
                    <span
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-inset ring-border"
                      title={t("lawLabel")}
                    >
                      {step.law}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      {step.time}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CalendarClock className="size-3 shrink-0" />
                      {step.deadline}
                    </span>
                    {isExternal ? (
                      <a
                        href={step.actionHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline print:hidden"
                      >
                        {step.actionText}
                        <ArrowRight className="size-3" />
                      </a>
                    ) : (
                      <Link
                        href={step.actionHref as never}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline print:hidden"
                      >
                        {step.actionText}
                        <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Anchor: personal time summary */}
      <Card className="rounded-xl border-primary/30 bg-primary/5 shadow-sm">
        <CardContent className="py-6 space-y-3">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <ShieldCheck className="size-5" />
            {t("anchor.heading")}
          </div>
          <ul className="space-y-1.5 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {t("anchor.lineSchulung")}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {t("anchor.lineSign")}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {t("anchor.lineYearly")}
            </li>
          </ul>
          <p className="pt-1 font-semibold">
            {t("anchor.totalLabel")}: <span className="text-primary">{t("anchor.total")}</span>
          </p>
          <p className="text-sm text-muted-foreground">{t("anchor.footer")}</p>
        </CardContent>
      </Card>

      {/* Compact repeat after the time anchor (no duplicated pitch copy) */}
      {platformCtaCompact}

      {/* Guided-help fork (DE/EN only; NL roadmap copy is not authored yet) */}
      {locale !== "nl" && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <span className="font-semibold">{t("guided.heading")}</span>{" "}
            <span className="text-muted-foreground">{t("guided.body")}</span>
          </div>
          <Link
            href={"/start" as never}
            className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
          >
            {t("guided.cta")}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
        {t("disclaimer")}
      </p>

      {/* Actions (hidden in print) */}
      <PrintShareActions
        printLabel={t("actions.print")}
        shareLabel={t("actions.share")}
        shareSubject={t("actions.shareSubject")}
        shareBody={t("actions.shareBody")}
      />

      {/* Transparency footer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4 space-y-1.5 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{t("transparency.heading")}</div>
          <div>{t("transparency.sources")}</div>
          <div className="print:hidden">
            <a
              href={t("transparency.openSourceUrl")}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              {t("transparency.openSource")}
            </a>
            {" · "}
            {t("transparency.hosting")}
          </div>
          <div className="hidden print:block">
            {t("transparency.openSource")} · {t("transparency.hosting")}
          </div>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
