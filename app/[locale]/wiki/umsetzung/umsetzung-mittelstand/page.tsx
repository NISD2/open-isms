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
  const title = t("smeGuide.meta.title");
  const description = t("smeGuide.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/umsetzung-mittelstand", locale),
    ...pageOg({
      slug: "wiki/umsetzung/umsetzung-mittelstand",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const phaseKeys = ["foundation", "risk", "controls", "evidence"] as const;
const roleKeys = ["complianceLead", "itContact", "managementSponsor", "externalAuditor"] as const;
const mistakeKeys = ["waiting", "overEngineering", "noManagement", "ignoreSupplyChain", "paperOnly"] as const;

export default async function SmeGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="umsetzung"
        slug="umsetzung-mittelstand"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung im Mittelstand"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["nis2"]}
      />
      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-3">{t("smeGuide.badge")}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("smeGuide.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("smeGuide.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("smeGuide.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("smeGuide.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("smeGuide.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("smeGuide.overview.p3")}</p>
      </section>

      {/* Who This Guide Is For */}
      <Card>
        <CardHeader>
          <CardTitle>{t("smeGuide.audience.heading")}</CardTitle>
          <CardDescription>{t("smeGuide.audience.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(["size", "limitedIt", "noCompliance", "firstTime"] as const).map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {t(`smeGuide.audience.items.${key}`)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Implementation Roadmap */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">{t("smeGuide.roadmap.heading")}</h2>

        {phaseKeys.map((phase) => (
          <Card key={phase}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{t(`smeGuide.roadmap.phases.${phase}.title`)}</CardTitle>
                <Badge variant="outline">{t(`smeGuide.roadmap.phases.${phase}.weeks`)}</Badge>
              </div>
              <CardDescription>{t(`smeGuide.roadmap.phases.${phase}.description`)}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(t.raw(`smeGuide.roadmap.phases.${phase}.actions`) as string[]).map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {action}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Roles You Need */}
      <Card>
        <CardHeader>
          <CardTitle>{t("smeGuide.roles.heading")}</CardTitle>
          <CardDescription>{t("smeGuide.roles.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {roleKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`smeGuide.roles.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`smeGuide.roles.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("smeGuide.mistakes.heading")}</CardTitle>
          <CardDescription>{t("smeGuide.mistakes.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {mistakeKeys.map((key) => (
              <li key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`smeGuide.mistakes.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`smeGuide.mistakes.items.${key}.description`)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle>{t("smeGuide.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("smeGuide.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("smeGuide.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
