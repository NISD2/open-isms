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
  const title = t("missedRegistration.meta.title");
  const description = t("missedRegistration.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/troubleshooting/nis2-registrierung-verpasst", locale),
    ...pageOg({
      slug: "wiki/troubleshooting/nis2-registrierung-verpasst",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const stepKeys = ["check", "register", "document", "implement", "legal"] as const;
const riskKeys = ["fines", "orders", "liability", "audit"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function MissedRegistrationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`missedRegistration.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`missedRegistration.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="troubleshooting"
        slug="nis2-registrierung-verpasst"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Compliance-Verantwortliche"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs,
        }}
      />

      <header>
        <Badge variant="secondary" className="mb-3">{"\u00A7"}33 BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("missedRegistration.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("missedRegistration.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* The short answer */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("missedRegistration.shortAnswer.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("missedRegistration.shortAnswer.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("missedRegistration.shortAnswer.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("missedRegistration.shortAnswer.p3")}</p>
      </section>

      {/* What to do now - step by step */}
      <Card>
        <CardHeader>
          <CardTitle>{t("missedRegistration.steps.heading")}</CardTitle>
          <CardDescription>{t("missedRegistration.steps.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stepKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(`missedRegistration.steps.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`missedRegistration.steps.items.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actual risks */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("missedRegistration.risks.heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("missedRegistration.risks.description")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {riskKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`missedRegistration.risks.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`missedRegistration.risks.items.${key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Context */}
      <Card>
        <CardHeader>
          <CardTitle>{t("missedRegistration.context.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("missedRegistration.context.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("missedRegistration.context.p2")}</p>
        </CardContent>
      </Card>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("missedRegistration.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`missedRegistration.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t(`missedRegistration.faq.${key}.a`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("missedRegistration.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("missedRegistration.sources.items") as string[]).map((source, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {source}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle>{t("missedRegistration.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("missedRegistration.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("missedRegistration.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
