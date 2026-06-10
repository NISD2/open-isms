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
  const title = t("sectorWaste.meta.title");
  const description = t("sectorWaste.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/sektoren/nis2-abfallwirtschaft", locale),
    ...pageOg({
      slug: "wiki/sektoren/nis2-abfallwirtschaft",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const assetKeys = ["fleet", "weighing", "erp", "scada", "endpoints", "network"] as const;
const priorityKeys = ["registration", "assets", "incidents", "access", "suppliers"] as const;
const faqKeys = ["q1", "q2", "q3", "q4"] as const;

export default async function SectorWastePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`sectorWaste.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`sectorWaste.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="sektoren"
        slug="nis2-abfallwirtschaft"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung in der Abfallwirtschaft"
        citationKeys={["nis2", "bsig", "cir-2024-2690"]}
        aboutKeys={["nis2"]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs,
        }}
      />

      <header>
        <Badge variant="secondary" className="mb-3">{t("sectorWaste.badge")}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("sectorWaste.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("sectorWaste.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("sectorWaste.why.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorWaste.why.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorWaste.why.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorWaste.why.p3")}</p>
      </section>

      {/* Typical asset inventory */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorWaste.assets.heading")}</CardTitle>
          <CardDescription>{t("sectorWaste.assets.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assetKeys.map((key) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{t(`sectorWaste.assets.items.${key}.title`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`sectorWaste.assets.items.${key}.detail`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Where to start */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorWaste.priorities.heading")}</CardTitle>
          <CardDescription>{t("sectorWaste.priorities.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priorityKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(`sectorWaste.priorities.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`sectorWaste.priorities.items.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What makes waste different */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorWaste.specifics.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorWaste.specifics.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorWaste.specifics.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorWaste.specifics.p3")}</p>
        </CardContent>
      </Card>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("sectorWaste.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`sectorWaste.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t(`sectorWaste.faq.${key}.a`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorWaste.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("sectorWaste.sources.items") as string[]).map((source, i) => (
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
          <CardTitle>{t("sectorWaste.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("sectorWaste.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("sectorWaste.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
