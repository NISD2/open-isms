import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("grundschutz.meta.title");
  const description = t("grundschutz.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/it-grundschutz", locale),
    ...pageOg({
      slug: "wiki/grundlagen/it-grundschutz",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const chainKeys = ["nis2", "bsig", "cir", "grundschutz"] as const;
const comparisonKeys = ["recognition", "coverage", "language"] as const;
const benefitKeys = ["audit", "alignment", "certainty"] as const;

export default async function ItGrundschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="grundlagen"
        slug="it-grundschutz"
        locale={locale}
        authorSlug="cory-hisey"
        proficiencyLevel="Expert"
        audienceType="IT-Verantwortliche und Compliance-Beauftragte"
        citationKeys={["nis2", "bsig", "enisa-tig"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />
      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-3">{"\u00A7"}44 BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("grundschutz.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("grundschutz.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="cory-hisey" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("grundschutz.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.overview.p3")}</p>
      </section>

      {/* The Legal Chain */}
      <Card>
        <CardHeader>
          <CardTitle>{t("grundschutz.chain.heading")}</CardTitle>
          <CardDescription>{t("grundschutz.chain.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {chainKeys.map((key, index) => (
              <div key={key} className="rounded-lg border p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold">{t(`grundschutz.chain.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`grundschutz.chain.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 44(2) BSIG */}
      <Card>
        <CardHeader>
          <CardTitle>{t("grundschutz.section44.heading")}</CardTitle>
          <CardDescription>{t("grundschutz.section44.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.section44.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.section44.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.section44.p3")}</p>
        </CardContent>
      </Card>

      {/* CIR 2024/2690 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("grundschutz.cir.heading")}</CardTitle>
          <CardDescription>{t("grundschutz.cir.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.cir.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.cir.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("grundschutz.cir.p3")}</p>
        </CardContent>
      </Card>

      {/* Grundschutz vs ISO 27001 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("grundschutz.comparison.heading")}</CardTitle>
          <CardDescription>{t("grundschutz.comparison.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {comparisonKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`grundschutz.comparison.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`grundschutz.comparison.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Why This Matters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("grundschutz.benefits.heading")}</CardTitle>
          <CardDescription>{t("grundschutz.benefits.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {benefitKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`grundschutz.benefits.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`grundschutz.benefits.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle>{t("grundschutz.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("grundschutz.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("grundschutz.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
