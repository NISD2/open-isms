import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("nis2Requirements.meta.title");
  const description = t("nis2Requirements.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/nis2-requirements", locale),
    ...pageOg({
      slug: "wiki/umsetzung/nis2-requirements",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const measureKeys = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"] as const;
const stageKeys = ["s1", "s2", "s3"] as const;
const evidenceKeys = ["audits", "certifications", "documentation"] as const;
const supplyChainKeys = ["assess", "contractual", "monitor", "coordinate", "risk"] as const;

export default async function Nis2RequirementsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="umsetzung"
        slug="nis2-requirements"
        locale={locale}
        authorSlug="cory-hisey"
        proficiencyLevel="Expert"
        audienceType="IT-Verantwortliche und Compliance-Beauftragte"
        citationKeys={["nis2", "bsig", "cir-2024-2690", "enisa-tig"]}
        aboutKeys={["nis2"]}
      />
      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-3">§ 30 BSIG / Art. 21</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("nis2Requirements.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("nis2Requirements.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="cory-hisey" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* 10 Measures */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("nis2Requirements.measures.heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("nis2Requirements.measures.description")}</p>
        </div>

        <div className="grid gap-3">
          {measureKeys.map((key, i) => (
            <Card key={key} className="py-4">
              <CardContent className="flex gap-4 py-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t(`nis2Requirements.measures.items.${key}.title`)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2Requirements.measures.items.${key}.description`)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Incident Reporting */}
      <Card>
        <CardHeader>
          <CardTitle>{t("nis2Requirements.incidentReporting.heading")}</CardTitle>
          <CardDescription>{t("nis2Requirements.incidentReporting.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {stageKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <Badge variant="outline" className="mb-2">{t(`nis2Requirements.incidentReporting.stages.${key}.deadline`)}</Badge>
                <p className="text-sm font-semibold">{t(`nis2Requirements.incidentReporting.stages.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`nis2Requirements.incidentReporting.stages.${key}.description`)}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">{t("nis2Requirements.incidentReporting.significant.heading")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2Requirements.incidentReporting.significant.p1")}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("nis2Requirements.incidentReporting.significant.p2")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Audit Requirements */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">{t("nis2Requirements.auditRequirements.heading")}</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {(["kritis", "bwe", "we"] as const).map((key) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base">{t(`nis2Requirements.auditRequirements.${key}.heading`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t(`nis2Requirements.auditRequirements.${key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("nis2Requirements.auditRequirements.evidence.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {evidenceKeys.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t(`nis2Requirements.auditRequirements.evidence.items.${key}`)}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{t("nis2Requirements.auditRequirements.evidence.note")}</p>
          </CardContent>
        </Card>
      </section>

      {/* Supply Chain */}
      <Card>
        <CardHeader>
          <CardTitle>{t("nis2Requirements.supplyChain.heading")}</CardTitle>
          <CardDescription>{t("nis2Requirements.supplyChain.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {supplyChainKeys.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {t(`nis2Requirements.supplyChain.items.${key}`)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
