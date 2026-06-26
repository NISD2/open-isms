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
  const title = t("bsigParagraph32.meta.title");
  const description = t("bsigParagraph32.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/bsig-32", locale),
    ...pageOg({
      slug: "wiki/grundlagen/bsig-32",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const stageKeys = ["s1", "s2", "s3"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function BsigParagraph32Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`bsigParagraph32.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`bsigParagraph32.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="grundlagen"
        slug="bsig-32"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung, CISO, Compliance-Verantwortliche"
        citationKeys={["nis2", "bsig", "cir-2024-2690", "gdpr"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs }} />

      <header>
        <Badge variant="secondary" className="mb-3">§ 32 BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("bsigParagraph32.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("bsigParagraph32.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("bsigParagraph32.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph32.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph32.overview.p2")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("bsigParagraph32.stages.heading")}</CardTitle>
          <CardDescription>{t("bsigParagraph32.stages.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stageKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(`bsigParagraph32.stages.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`bsigParagraph32.stages.items.${key}.text`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">{t("bsigParagraph32.significant.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">{t("bsigParagraph32.significant.p1")}</p>
          <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">{t("bsigParagraph32.significant.p2")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bsigParagraph32.process.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph32.process.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph32.process.p2")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bsigParagraph32.gdpr.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph32.gdpr.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph32.gdpr.p2")}</p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("bsigParagraph32.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`bsigParagraph32.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`bsigParagraph32.faq.${key}.a`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("bsigParagraph32.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("bsigParagraph32.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={{ pathname: "/auth/signin", query: { callbackUrl: "/gap-assessment" } }}>
              {t("bsigParagraph32.cta")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
