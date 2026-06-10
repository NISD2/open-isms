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
  const title = t("securityObligation.meta.title");
  const description = t("securityObligation.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/it-sicherheitspflicht", locale),
    ...pageOg({
      slug: "wiki/grundlagen/it-sicherheitspflicht",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const checkKeys = ["sector", "size", "revenue", "services"] as const;
const stepKeys = ["register", "assess", "implement", "report", "maintain"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function SecurityObligationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`securityObligation.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`securityObligation.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="grundlagen"
        slug="it-sicherheitspflicht"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs }} />

      <header>
        <Badge variant="secondary" className="mb-3">BSIG 2025</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("securityObligation.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("securityObligation.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("securityObligation.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("securityObligation.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("securityObligation.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("securityObligation.overview.p3")}</p>
      </section>

      {/* Am I affected? */}
      <Card>
        <CardHeader>
          <CardTitle>{t("securityObligation.check.heading")}</CardTitle>
          <CardDescription>{t("securityObligation.check.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {checkKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`securityObligation.check.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`securityObligation.check.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What you need to do */}
      <Card>
        <CardHeader>
          <CardTitle>{t("securityObligation.steps.heading")}</CardTitle>
          <CardDescription>{t("securityObligation.steps.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stepKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(`securityObligation.steps.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`securityObligation.steps.items.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What happens if I don't */}
      <Card>
        <CardHeader>
          <CardTitle>{t("securityObligation.consequences.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("securityObligation.consequences.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("securityObligation.consequences.p2")}</p>
        </CardContent>
      </Card>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("securityObligation.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`securityObligation.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`securityObligation.faq.${key}.a`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("securityObligation.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("securityObligation.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/applicability">{t("securityObligation.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
