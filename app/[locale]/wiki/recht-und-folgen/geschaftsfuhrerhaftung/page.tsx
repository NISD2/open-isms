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
  const title = t("ceoLiability.meta.title");
  const description = t("ceoLiability.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/recht-und-folgen/geschaftsfuhrerhaftung", locale),
    ...pageOg({
      slug: "wiki/recht-und-folgen/geschaftsfuhrerhaftung",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const dutyKeys = ["approval", "oversight", "training"] as const;
const consequenceKeys = ["noMeasures", "noReporting", "noTraining", "noOversight"] as const;
const misconceptionKeys = ["delegate", "insurance", "ignorance", "waiver", "smallCompany"] as const;
const stepKeys = ["step1", "step2", "step3"] as const;

export default async function CeoLiabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
        category="recht-und-folgen"
        slug="geschaftsfuhrerhaftung"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Gesch\u00E4ftsf\u00FChrung und Vorstand"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />

      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-3">{"\u00A7"}38 BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("ceoLiability.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("ceoLiability.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Overview */}
      <section className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{t("ceoLiability.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("ceoLiability.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("ceoLiability.overview.p3")}</p>
      </section>

      {/* Three Core Duties */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ceoLiability.duties.heading")}</CardTitle>
          <CardDescription>{t("ceoLiability.duties.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {dutyKeys.map((key, index) => (
              <div key={key} className="rounded-lg border p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold">{t(`ceoLiability.duties.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`ceoLiability.duties.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What Happens When You Fail */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ceoLiability.consequences.heading")}</CardTitle>
          <CardDescription>{t("ceoLiability.consequences.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {consequenceKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`ceoLiability.consequences.items.${key}.violation`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`ceoLiability.consequences.items.${key}.consequence`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Misconceptions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ceoLiability.misconceptions.heading")}</CardTitle>
          <CardDescription>{t("ceoLiability.misconceptions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {misconceptionKeys.map((key) => (
              <li key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`ceoLiability.misconceptions.items.${key}.myth`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`ceoLiability.misconceptions.items.${key}.reality`)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Personal Risk */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ceoLiability.personalRisk.heading")}</CardTitle>
          <CardDescription>{t("ceoLiability.personalRisk.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("ceoLiability.personalRisk.liableToCompany")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("ceoLiability.personalRisk.cannotWaive")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("ceoLiability.personalRisk.cannotClaimIgnorance")}</p>
        </CardContent>
      </Card>

      {/* Three Steps to Protect Yourself */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ceoLiability.steps.heading")}</CardTitle>
          <CardDescription>{t("ceoLiability.steps.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stepKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(`ceoLiability.steps.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`ceoLiability.steps.items.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ceoLiability.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("ceoLiability.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("ceoLiability.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
      </div>
    </GlossedProse>
  );
}
