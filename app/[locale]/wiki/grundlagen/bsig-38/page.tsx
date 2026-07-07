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
  const title = t("bsigParagraph38.meta.title");
  const description = t("bsigParagraph38.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/bsig-38", locale),
    ...pageOg({
      slug: "wiki/grundlagen/bsig-38",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const dutyKeys = ["d1", "d2", "d3"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function BsigParagraph38Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`bsigParagraph38.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`bsigParagraph38.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="grundlagen"
        slug="bsig-38"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung, Vorstand, CISO"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs }} />

      <header>
        <Badge variant="secondary" className="mb-3">§ 38 BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("bsigParagraph38.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("bsigParagraph38.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("bsigParagraph38.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph38.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph38.overview.p2")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("bsigParagraph38.duties.heading")}</CardTitle>
          <CardDescription>{t("bsigParagraph38.duties.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dutyKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(`bsigParagraph38.duties.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`bsigParagraph38.duties.items.${key}.text`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">{t("bsigParagraph38.liability.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">{t("bsigParagraph38.liability.p1")}</p>
          <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">{t("bsigParagraph38.liability.p2")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bsigParagraph38.training.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph38.training.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph38.training.p2")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bsigParagraph38.scope.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph38.scope.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("bsigParagraph38.scope.p2")}</p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("bsigParagraph38.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`bsigParagraph38.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`bsigParagraph38.faq.${key}.a`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("bsigParagraph38.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("bsigParagraph38.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/training/nis2-ceo">
              {t("bsigParagraph38.cta")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
