import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
        <Badge variant="secondary" className="print:hidden">
          {t("heroBadge")}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          {t("heroTitle")}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          {t("heroSubtitle")}
        </p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      {/* Triage opener */}
      <Card className="border-primary/20 bg-muted/30 print:hidden">
        <CardContent className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="font-semibold mb-1">{t("triageHeading")}</div>
            <p className="text-sm text-muted-foreground">{t("triageBody")}</p>
          </div>
          <Link
            href="/applicability"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow shrink-0 hover:bg-primary/90 transition-colors"
          >
            {t("triageCta")}
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      {/* Steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">{t("stepsHeading")}</h2>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <Card
              key={step.key}
              className={
                step.isPersonal
                  ? "border-l-4 border-l-primary"
                  : "border-l-2 border-l-border"
              }
            >
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted font-bold text-lg shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      {step.isPersonal ? (
                        <Badge className="gap-1">
                          <ShieldCheck className="size-3" />
                          {t("personalBadge")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t("delegableBadge")}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.what}
                    </p>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1">
                      <div>
                        <dt className="inline font-medium text-foreground">
                          {t("lawLabel")}:
                        </dt>{" "}
                        <dd className="inline text-muted-foreground">
                          {step.law}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-foreground">
                          {t("ownerLabel")}:
                        </dt>{" "}
                        <dd className="inline text-muted-foreground">
                          {step.owner}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-foreground">
                          {t("timeLabel")}:
                        </dt>{" "}
                        <dd className="inline text-muted-foreground">
                          {step.time}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-foreground">
                          {t("deadlineLabel")}:
                        </dt>{" "}
                        <dd className="inline text-muted-foreground">
                          {step.deadline}
                        </dd>
                      </div>
                    </dl>
                    <div className="pt-2 print:hidden">
                      {step.actionHref.startsWith("http") ? (
                        <a
                          href={step.actionHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          {step.actionText}
                          <ArrowRight className="size-3.5" />
                        </a>
                      ) : (
                        <Link
                          href={step.actionHref as never}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          {step.actionText}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Anchor: personal time summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-6 space-y-3">
          <h2 className="text-xl font-bold">{t("anchor.heading")}</h2>
          <ul className="space-y-1.5 text-sm leading-relaxed">
            <li>• {t("anchor.lineSchulung")}</li>
            <li>• {t("anchor.lineSign")}</li>
            <li>• {t("anchor.lineYearly")}</li>
          </ul>
          <p className="font-semibold pt-1">
            {t("anchor.totalLabel")}: <span className="text-primary">{t("anchor.total")}</span>
          </p>
          <p className="text-sm text-muted-foreground">{t("anchor.footer")}</p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground leading-relaxed border-t pt-4">
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
