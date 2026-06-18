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
  const title = t("incidentReporting.meta.title");
  const description = t("incidentReporting.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-meldepflicht", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-meldepflicht",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const timelineKeys = ["early", "update", "intermediate", "final", "progress"] as const;
const criteriaKeys = ["disruption", "financial", "spread", "data", "duration"] as const;
const fieldKeys = ["entity", "nature", "impact", "crossBorder", "measures"] as const;
const penaltyKeys = ["essential", "important", "management"] as const;

export default async function IncidentReportingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="umsetzung"
        slug="nis2-meldepflicht"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Incident-Response-Verantwortliche"
        citationKeys={["nis2", "bsig", "cir-2024-2690"]}
        aboutKeys={["nis2"]}
      />
      <header>
        <Badge variant="secondary" className="mb-3">{"\u00A7"}32 BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("incidentReporting.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("incidentReporting.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("incidentReporting.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("incidentReporting.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("incidentReporting.overview.p2")}</p>
      </section>

      {/* Reporting Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("incidentReporting.timeline.heading")}</CardTitle>
          <CardDescription>{t("incidentReporting.timeline.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{t(`incidentReporting.timeline.items.${key}.title`)}</p>
                    <Badge variant="outline">{t(`incidentReporting.timeline.items.${key}.deadline`)}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`incidentReporting.timeline.items.${key}.description`)}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {(t.raw(`incidentReporting.timeline.items.${key}.contents`) as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What Counts as Significant */}
      <Card>
        <CardHeader>
          <CardTitle>{t("incidentReporting.criteria.heading")}</CardTitle>
          <CardDescription>{t("incidentReporting.criteria.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {criteriaKeys.map((key) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{t(`incidentReporting.criteria.items.${key}.title`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(`incidentReporting.criteria.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Report Fields */}
      <Card>
        <CardHeader>
          <CardTitle>{t("incidentReporting.fields.heading")}</CardTitle>
          <CardDescription>{t("incidentReporting.fields.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {fieldKeys.map((key) => (
              <li key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`incidentReporting.fields.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`incidentReporting.fields.items.${key}.description`)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Where to Report */}
      <Card>
        <CardHeader>
          <CardTitle>{t("incidentReporting.where.heading")}</CardTitle>
          <CardDescription>{t("incidentReporting.where.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("incidentReporting.where.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("incidentReporting.where.p2")}</p>
        </CardContent>
      </Card>

      {/* Penalties */}
      <Card>
        <CardHeader>
          <CardTitle>{t("incidentReporting.penalties.heading")}</CardTitle>
          <CardDescription>{t("incidentReporting.penalties.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {penaltyKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4 text-center">
                <p className="text-lg font-bold text-destructive">{t(`incidentReporting.penalties.items.${key}.amount`)}</p>
                <p className="mt-1 text-sm font-medium">{t(`incidentReporting.penalties.items.${key}.label`)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(`incidentReporting.penalties.items.${key}.detail`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("incidentReporting.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("incidentReporting.sources.items") as string[]).map((source, i) => (
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
          <CardTitle>{t("incidentReporting.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("incidentReporting.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("incidentReporting.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
