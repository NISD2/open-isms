import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("supplyChain.meta.title");
  const description = t("supplyChain.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-lieferkette", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-lieferkette",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const reasonKeys = ["contracts", "audits", "incidents", "reputation", "insurance"] as const;
const requirementKeys = ["riskManagement", "accessControl", "incidentReporting", "businessContinuity", "documentation"] as const;
const stepKeys = ["check", "gap", "implement", "evidence", "maintain"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function SupplyChainPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`supplyChain.faq.${key}.q`),
    acceptedAnswer: { "@type": "Answer" as const, text: t(`supplyChain.faq.${key}.a`) },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="umsetzung"
        slug="nis2-lieferkette"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Einkauf"
        citationKeys={["nis2", "bsig", "cra"]}
        aboutKeys={["nis2"]}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs }} />

      <header>
        <Badge variant="secondary" className="mb-3">{t("supplyChain.badge")}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("supplyChain.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("supplyChain.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Why suppliers are affected */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("supplyChain.why.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("supplyChain.why.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("supplyChain.why.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("supplyChain.why.p3")}</p>
      </section>

      {/* Legal basis callout */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t("supplyChain.legalBasis.heading")}</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{t("supplyChain.legalBasis.text")}</p>
        </CardContent>
      </Card>

      {/* 5 reasons customers will require it */}
      <Card>
        <CardHeader>
          <CardTitle>{t("supplyChain.reasons.heading")}</CardTitle>
          <CardDescription>{t("supplyChain.reasons.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reasonKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                <div>
                  <p className="text-sm font-semibold">{t(`supplyChain.reasons.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`supplyChain.reasons.items.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What requirements apply */}
      <Card>
        <CardHeader>
          <CardTitle>{t("supplyChain.requirements.heading")}</CardTitle>
          <CardDescription>{t("supplyChain.requirements.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {requirementKeys.map((key) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{t(`supplyChain.requirements.items.${key}.title`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`supplyChain.requirements.items.${key}.detail`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step-by-step: what to do */}
      <Card>
        <CardHeader>
          <CardTitle>{t("supplyChain.steps.heading")}</CardTitle>
          <CardDescription>{t("supplyChain.steps.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stepKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                <div>
                  <p className="text-sm font-semibold">{t(`supplyChain.steps.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`supplyChain.steps.items.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("supplyChain.faqHeading")}</h2>
        {faqKeys.map((key) => (
          <details key={key} className="group rounded-lg border p-4">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
              {t(`supplyChain.faq.${key}.q`)}
              <span className="ml-2 text-muted-foreground transition-transform group-open:rotate-180">&#9662;</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`supplyChain.faq.${key}.a`)}</p>
          </details>
        ))}
      </section>

      {/* Questionnaire CTA */}
      <Card>
        <CardHeader>
          <CardTitle>{t("supplyChain.questionnaireCta.heading")}</CardTitle>
          <CardDescription>{t("supplyChain.questionnaireCta.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/nis2-lieferanten-fragebogen">{t("supplyChain.questionnaireCta.button")}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="text-center">
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold">{t("supplyChain.cta.heading")}</h2>
          <p className="text-sm text-muted-foreground">{t("supplyChain.cta.description")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild>
              <Link href="/applicability">{t("supplyChain.cta.checkButton")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/signin">{t("supplyChain.cta.startButton")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
