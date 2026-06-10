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
  const title = t("sectorLogistics.meta.title");
  const description = t("sectorLogistics.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/sektoren/nis2-logistik", locale),
    ...pageOg({
      slug: "wiki/sektoren/nis2-logistik",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const assetKeys = ["tms", "fleet", "warehouse", "erp", "network", "endpoints"] as const;
const priorityKeys = ["registration", "assets", "incidents", "suppliers", "access"] as const;
const faqKeys = ["q1", "q2", "q3", "q4"] as const;

export default async function SectorLogisticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`sectorLogistics.faq.${key}.q`),
    acceptedAnswer: { "@type": "Answer" as const, text: t(`sectorLogistics.faq.${key}.a`) },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="sektoren"
        slug="nis2-logistik"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung in Logistik und Transport"
        citationKeys={["nis2", "bsig", "cir-2024-2690"]}
        aboutKeys={["nis2"]}
      />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs }} />
      <header>
        <Badge variant="secondary" className="mb-3">{t("sectorLogistics.badge")}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("sectorLogistics.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("sectorLogistics.subtitle")}</p>
      </header>
      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />
      <Separator />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("sectorLogistics.why.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorLogistics.why.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorLogistics.why.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorLogistics.why.p3")}</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorLogistics.assets.heading")}</CardTitle>
          <CardDescription>{t("sectorLogistics.assets.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assetKeys.map((key) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{t(`sectorLogistics.assets.items.${key}.title`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`sectorLogistics.assets.items.${key}.detail`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorLogistics.priorities.heading")}</CardTitle>
          <CardDescription>{t("sectorLogistics.priorities.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priorityKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                <div>
                  <p className="text-sm font-semibold">{t(`sectorLogistics.priorities.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`sectorLogistics.priorities.items.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("sectorLogistics.specifics.heading")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorLogistics.specifics.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorLogistics.specifics.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("sectorLogistics.specifics.p3")}</p>
        </CardContent>
      </Card>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("sectorLogistics.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}><CardContent className="pt-6">
              <p className="text-sm font-semibold">{t(`sectorLogistics.faq.${key}.q`)}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`sectorLogistics.faq.${key}.a`)}</p>
            </CardContent></Card>
          ))}
        </div>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{t("sectorLogistics.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("sectorLogistics.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent><Button asChild><Link href="/auth/signin">{t("sectorLogistics.cta")}</Link></Button></CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
