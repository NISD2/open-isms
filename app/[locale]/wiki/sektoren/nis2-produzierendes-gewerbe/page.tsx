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
  const title = t("sectorManufacturing.meta.title");
  const description = t("sectorManufacturing.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/sektoren/nis2-produzierendes-gewerbe", locale),
    ...pageOg({
      slug: "wiki/sektoren/nis2-produzierendes-gewerbe",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const assetKeys = ["mes", "scada", "erp", "cad", "network", "endpoints"] as const;
const priorityKeys = ["registration", "assets", "otSecurity", "incidents", "suppliers"] as const;
const faqKeys = ["q1", "q2", "q3", "q4"] as const;

export default async function SectorManufacturingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`sectorManufacturing.faq.${key}.q`),
    acceptedAnswer: { "@type": "Answer" as const, text: t(`sectorManufacturing.faq.${key}.a`) },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="sektoren"
        slug="nis2-produzierendes-gewerbe"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung im produzierenden Gewerbe"
        citationKeys={["nis2", "bsig", "cir-2024-2690", "cra"]}
        aboutKeys={["nis2"]}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs }} />
      <header>
        <Badge variant="secondary" className="mb-3">{t("sectorManufacturing.badge")}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("sectorManufacturing.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("sectorManufacturing.subtitle")}</p>
      </header>
      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />
      <Separator />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("sectorManufacturing.why.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorManufacturing.why.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorManufacturing.why.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorManufacturing.why.p3")}</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorManufacturing.assets.heading")}</CardTitle>
          <CardDescription>{t("sectorManufacturing.assets.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assetKeys.map((key) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{t(`sectorManufacturing.assets.items.${key}.title`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`sectorManufacturing.assets.items.${key}.detail`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorManufacturing.priorities.heading")}</CardTitle>
          <CardDescription>{t("sectorManufacturing.priorities.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priorityKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                <div>
                  <p className="text-sm font-semibold">{t(`sectorManufacturing.priorities.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`sectorManufacturing.priorities.items.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("sectorManufacturing.specifics.heading")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorManufacturing.specifics.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorManufacturing.specifics.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorManufacturing.specifics.p3")}</p>
        </CardContent>
      </Card>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("sectorManufacturing.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}><CardContent className="pt-6">
              <p className="text-sm font-semibold">{t(`sectorManufacturing.faq.${key}.q`)}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`sectorManufacturing.faq.${key}.a`)}</p>
            </CardContent></Card>
          ))}
        </div>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorManufacturing.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("sectorManufacturing.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent><Button asChild><Link href="/auth/signin">{t("sectorManufacturing.cta")}</Link></Button></CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
