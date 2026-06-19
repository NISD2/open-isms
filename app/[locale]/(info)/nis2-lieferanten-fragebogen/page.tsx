import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/lib/seo";
import { pickLocalized } from "@/lib/locale";
import { ogImages } from "@/lib/og-card";
import { JsonLd } from "@/components/JsonLd";
import {
  supplierQuestionnaire,
  groupBySection,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { Download, FileCode, FileText, ExternalLink } from "lucide-react";

type Locale = "de" | "en" | "nl";

const SECTION_ORDER = [
  "profile",
  "security_practices",
  "saas_technical",
  "on_prem_technical",
  "pro_services",
  "managed_services",
] as const;

const SCHEMA_REPO_URL =
  "https://github.com/NISD2/nis2-supply-chain-questionnaire-schema";
const SCHEMA_JSON_URL = `${SCHEMA_REPO_URL}/blob/main/data/supply-chain-questionnaire.json`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("supplierQuestionnaire.meta.title"),
    description: t("supplierQuestionnaire.meta.description"),
    alternates: pageAlternates("/nis2-lieferanten-fragebogen", locale),
    openGraph: {
      images: ogImages("nis2-lieferanten-fragebogen", locale, t("supplierQuestionnaire.meta.title")),
    },
  };
}

function pickLocaleString(
  value: { en: string; de: string } & Record<string, string | undefined>,
  locale: string,
): string {
  return pickLocalized(value, locale);
}

export default async function SupplierQuestionnairePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale;
  const t = await getTranslations("info");
  const grouped = groupBySection(supplierQuestionnaire);
  const totalFields = supplierQuestionnaire.fields.length;

  // FAQ JSON-LD around the EU anchoring claim is the most likely rich-result hit.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("supplierQuestionnaire.meta.title"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("supplierQuestionnaire.meta.description"),
        },
      },
    ],
  };

  return (
    <div className="space-y-10">
      <JsonLd data={faqJsonLd} />

      <header>
        <Badge variant="secondary" className="mb-3">
          {t("supplierQuestionnaire.badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("supplierQuestionnaire.title")}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("supplierQuestionnaire.subtitle")}
        </p>
      </header>

      <Separator />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("supplierQuestionnaire.intro.p1")}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("supplierQuestionnaire.intro.p2")}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("supplierQuestionnaire.downloads.heading")}</CardTitle>
          <CardDescription>
            {t("supplierQuestionnaire.downloads.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="default">
              <a href={`/api/supplier-questionnaire/pdf?locale=${locale}`}>
                <FileText className="mr-2 h-4 w-4" />
                {t("supplierQuestionnaire.downloads.pdf")}
              </a>
            </Button>
            <Button asChild variant="default">
              <a href={`/api/supplier-questionnaire/docx?locale=${locale}`}>
                <Download className="mr-2 h-4 w-4" />
                {t("supplierQuestionnaire.downloads.docx")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={SCHEMA_JSON_URL} target="_blank" rel="noopener noreferrer">
                <FileCode className="mr-2 h-4 w-4" />
                {t("supplierQuestionnaire.downloads.json")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={SCHEMA_REPO_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("supplierQuestionnaire.downloads.schemaRepo")}
              </a>
            </Button>
          </div>
          <Separator />
          <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">
                {t("supplierQuestionnaire.meta_panel.version")}
              </dt>
              <dd className="mt-0.5 font-mono font-medium">{supplierQuestionnaire.version}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("supplierQuestionnaire.meta_panel.lastUpdated")}
              </dt>
              <dd className="mt-0.5 font-mono font-medium">{supplierQuestionnaire.lastUpdated}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("supplierQuestionnaire.meta_panel.fields")}
              </dt>
              <dd className="mt-0.5 font-mono font-medium">{totalFields}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("supplierQuestionnaire.meta_panel.license")}
              </dt>
              <dd className="mt-0.5 text-xs font-medium">
                {t("supplierQuestionnaire.meta_panel.licenseValue")}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {SECTION_ORDER.map((sectionId) => {
        const fields = grouped.get(sectionId) ?? [];
        if (fields.length === 0) return null;
        return (
          <section key={sectionId} className="space-y-4">
            <header className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                {t(`supplierQuestionnaire.sections.${sectionId}`)}
              </h2>
              <span className="text-xs text-muted-foreground">
                {fields.length} {t("supplierQuestionnaire.meta_panel.fields").toLowerCase()}
              </span>
            </header>
            <div className="space-y-3">
              {fields.map((field) => {
                const label = pickLocaleString(field.label, locale);
                const description = pickLocaleString(field.description, locale);
                const requiredLabel = field.visibleWhen
                  ? t("supplierQuestionnaire.field.conditional")
                  : field.required
                    ? t("supplierQuestionnaire.field.required")
                    : t("supplierQuestionnaire.field.optional");
                return (
                  <Card key={field.id}>
                    <CardContent className="space-y-2 pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{label}</p>
                        <div className="flex gap-1.5">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {field.type}
                          </Badge>
                          <Badge
                            variant={field.required ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {requiredLabel}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="text-muted-foreground/70">
                          {t("supplierQuestionnaire.field.legalBasis")}:
                        </span>{" "}
                        <span className="font-mono">{field.legalBasis}</span>
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>{t("supplierQuestionnaire.useNote.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("supplierQuestionnaire.useNote.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("supplierQuestionnaire.useNote.p2")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("supplierQuestionnaire.ctaCard.heading")}</CardTitle>
          <CardDescription>
            {t("supplierQuestionnaire.ctaCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("supplierQuestionnaire.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
