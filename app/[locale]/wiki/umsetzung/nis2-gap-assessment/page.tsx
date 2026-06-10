import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardCheck,
  Clock,
  BarChart3,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Scale,
  Users,
  Shield,
} from "lucide-react";
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
  const title = t("gapAssessmentLanding.meta.title");
  const description = t("gapAssessmentLanding.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-gap-assessment", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-gap-assessment",
      locale,
      title: t("gapAssessmentLanding.meta.ogTitle"),
      description: t("gapAssessmentLanding.meta.ogDescription"),
      type: "article",
    }),
  };
}

const highlights = [
  { icon: ClipboardCheck, key: "questions" },
  { icon: Clock, key: "time" },
  { icon: BarChart3, key: "scoring" },
  { icon: FileDown, key: "report" },
] as const;

const days = [
  { day: 1, icon: Shield, key: "day1" },
  { day: 2, icon: AlertTriangle, key: "day2" },
  { day: 3, icon: Scale, key: "day3" },
  { day: 4, icon: Users, key: "day4" },
  { day: 5, icon: CheckCircle2, key: "day5" },
] as const;

export default async function GapAssessmentLandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-12">
      <WikiPageJsonLd
        category="umsetzung"
        slug="nis2-gap-assessment"
        locale={locale}
        authorSlug="cory-hisey"
        proficiencyLevel="Intermediate"
        audienceType="IT-Verantwortliche und Compliance-Beauftragte"
        citationKeys={["nis2", "bsig", "cir-2024-2690", "enisa-tig"]}
        aboutKeys={["nis2"]}
      />
      {/* Hero */}
      <header className="space-y-4">
        <Badge variant="secondary">{t("gapAssessmentLanding.badge")}</Badge>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          {t("gapAssessmentLanding.title")}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          {t("gapAssessmentLanding.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={{ pathname: "/auth/signin", query: { callbackUrl: "/gap-assessment" } }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {t("gapAssessmentLanding.cta")}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <WikiPageMeta authorSlug="cory-hisey" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {highlights.map((h) => {
          const Icon = h.icon;
          return (
            <div key={h.key} className="flex gap-4">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-semibold">{t(`gapAssessmentLanding.highlights.${h.key}.title`)}</div>
                <div className="text-sm text-muted-foreground">
                  {t(`gapAssessmentLanding.highlights.${h.key}.description`)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* 5-day structure */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{t("gapAssessmentLanding.structure.heading")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("gapAssessmentLanding.structure.body")}
        </p>
        <div className="space-y-3 pt-2">
          {days.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.day} className="flex items-start gap-3 rounded-md border p-4">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">{d.day}</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{t(`gapAssessmentLanding.structure.${d.key}.title`)}</div>
                  <div className="text-sm text-muted-foreground">
                    {t(`gapAssessmentLanding.structure.${d.key}.description`)}
                  </div>
                </div>
                <Icon className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* What you get */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">{t("gapAssessmentLanding.output.heading")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("gapAssessmentLanding.output.body")}
        </p>
      </section>

      {/* Who is this for */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">{t("gapAssessmentLanding.whoFor.heading")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("gapAssessmentLanding.whoFor.body")}
        </p>
      </section>

      <Separator />

      {/* CTA */}
      <div className="rounded-lg border bg-muted/30 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">
          {t("gapAssessmentLanding.ctaCard.heading")}
        </h2>
        <p className="text-muted-foreground">
          {t("gapAssessmentLanding.ctaCard.body")}
        </p>
        <Link
          href={{ pathname: "/auth/signin", query: { callbackUrl: "/gap-assessment" } }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          {t("gapAssessmentLanding.cta")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
    </GlossedProse>
  );
}
