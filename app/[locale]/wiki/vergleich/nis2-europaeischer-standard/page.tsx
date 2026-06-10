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
  const title = t("europeanStandard.meta.title");
  const description = t("europeanStandard.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/vergleich/nis2-europaeischer-standard", locale),
    ...pageOg({
      slug: "wiki/vergleich/nis2-europaeischer-standard",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const layerKeys = ["directive", "nationalLaw", "cir", "grundschutz"] as const;
const benefitKeys = ["crossBorder", "noGuesswork", "futureProof", "auditReady"] as const;
const comparisonKeys = ["riskManagement", "incidentReporting", "supplyChain", "encryption", "accessControl", "training"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function EuropeanStandardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`europeanStandard.faq.${key}.q`),
    acceptedAnswer: { "@type": "Answer" as const, text: t(`europeanStandard.faq.${key}.a`) },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="vergleich"
        slug="nis2-europaeischer-standard"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und IT-Verantwortliche"
        citationKeys={["nis2", "enisa-tig"]}
        aboutKeys={["nis2"]}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs }} />

      <header>
        <Badge variant="secondary" className="mb-3">{t("europeanStandard.badge")}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("europeanStandard.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("europeanStandard.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* The problem */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("europeanStandard.problem.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.problem.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.problem.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.problem.p3")}</p>
      </section>

      {/* Legal layers */}
      <Card>
        <CardHeader>
          <CardTitle>{t("europeanStandard.layers.heading")}</CardTitle>
          <CardDescription>{t("europeanStandard.layers.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {layerKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                <div>
                  <p className="text-sm font-semibold">{t(`europeanStandard.layers.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`europeanStandard.layers.items.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Our approach */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("europeanStandard.approach.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.approach.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.approach.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.approach.p3")}</p>
      </section>

      {/* Comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("europeanStandard.comparison.heading")}</CardTitle>
          <CardDescription>{t("europeanStandard.comparison.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 pr-4 text-left font-semibold">{t("europeanStandard.comparison.colArea")}</th>
                  <th className="pb-3 pr-4 text-left font-semibold">{t("europeanStandard.comparison.colDirective")}</th>
                  <th className="pb-3 pr-4 text-left font-semibold">{t("europeanStandard.comparison.colCir")}</th>
                  <th className="pb-3 text-left font-semibold">{t("europeanStandard.comparison.colBsig")}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonKeys.map((key) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{t(`europeanStandard.comparison.rows.${key}.area`)}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{t(`europeanStandard.comparison.rows.${key}.directive`)}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{t(`europeanStandard.comparison.rows.${key}.cir`)}</td>
                    <td className="py-3 text-xs text-muted-foreground">{t(`europeanStandard.comparison.rows.${key}.bsig`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>{t("europeanStandard.benefits.heading")}</CardTitle>
          <CardDescription>{t("europeanStandard.benefits.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefitKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`europeanStandard.benefits.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`europeanStandard.benefits.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* The extra work myth */}
      <Card>
        <CardHeader>
          <CardTitle>{t("europeanStandard.myth.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.myth.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.myth.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("europeanStandard.myth.p3")}</p>
        </CardContent>
      </Card>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("europeanStandard.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`europeanStandard.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`europeanStandard.faq.${key}.a`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("europeanStandard.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("europeanStandard.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("europeanStandard.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
