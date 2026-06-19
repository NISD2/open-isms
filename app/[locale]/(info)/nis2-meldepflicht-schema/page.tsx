import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/lib/seo";
import { pickLocalized } from "@/lib/locale";
import { JsonLd } from "@/components/JsonLd";
import {
  incidentNotificationSchema,
  groupBySection,
  REPORT_TYPE_DPV_URI,
  type IncidentField,
  type LocalisedString,
  type SectionValue,
} from "@nisd2/incident-notification-schema";
import { FileCode, Package } from "lucide-react";

type Locale = "de" | "en" | "nl";

const SCHEMA_REPO_URL =
  "https://github.com/NISD2/nis2-incident-notification-schema";
const SCHEMA_NPM_URL =
  "https://www.npmjs.com/package/@nisd2/incident-notification-schema";

const SECTION_ORDER: ReadonlyArray<SectionValue> = [
  "classification",
  "description",
  "timing",
  "causation",
  "responseMeasures",
  "impact",
  "crossBorder",
  "geographicSectoral",
  "affectedAssets",
  "affectedSuppliers",
  "criminalProsecution",
  "reporterContact",
  "sectoralOverlay",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("meldepflichtSchema.meta.title"),
    description: t("meldepflichtSchema.meta.description"),
    alternates: pageAlternates("/nis2-meldepflicht-schema", locale),
  };
}

function pickLocaleString(value: LocalisedString, locale: string): string {
  return pickLocalized(value as Record<string, string | undefined>, locale);
}

export default async function MeldepflichtSchemaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale;
  const t = await getTranslations("info");

  const grouped = groupBySection();
  const totalFields = incidentNotificationSchema.fields.length;
  const totalReportTypes = incidentNotificationSchema.reportTypes.length;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("meldepflichtSchema.meta.title"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("meldepflichtSchema.meta.description"),
        },
      },
    ],
  };

  return (
    <div className="space-y-10">
      <JsonLd data={faqJsonLd} />

      <header>
        <Badge variant="secondary" className="mb-3">
          {t("meldepflichtSchema.badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("meldepflichtSchema.title")}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("meldepflichtSchema.subtitle")}
        </p>
      </header>

      <Separator />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("meldepflichtSchema.intro.p1")}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("meldepflichtSchema.intro.p2")}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("meldepflichtSchema.anchors.heading")}</CardTitle>
          <CardDescription>
            {t("meldepflichtSchema.anchors.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {incidentNotificationSchema.euInstruments.map((instrument) => (
              <li key={instrument.citation} className="flex gap-2">
                <span className="text-muted-foreground">·</span>
                {instrument.url ? (
                  <a
                    href={instrument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    {instrument.citation}
                  </a>
                ) : (
                  <span>{instrument.citation}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("meldepflichtSchema.downloads.heading")}</CardTitle>
          <CardDescription>
            {t("meldepflichtSchema.downloads.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="default">
              <a href={SCHEMA_NPM_URL} target="_blank" rel="noopener noreferrer">
                <Package className="mr-2 h-4 w-4" />
                {t("meldepflichtSchema.downloads.npm")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={SCHEMA_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileCode className="mr-2 h-4 w-4" />
                {t("meldepflichtSchema.downloads.github")}
              </a>
            </Button>
          </div>
          <Separator />
          <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">
                {t("meldepflichtSchema.meta_panel.version")}
              </dt>
              <dd className="mt-0.5 font-mono font-medium">
                {incidentNotificationSchema.version}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("meldepflichtSchema.meta_panel.lastUpdated")}
              </dt>
              <dd className="mt-0.5 font-mono font-medium">
                {incidentNotificationSchema.lastUpdated}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("meldepflichtSchema.meta_panel.fields")}
              </dt>
              <dd className="mt-0.5 font-mono font-medium">{totalFields}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("meldepflichtSchema.meta_panel.reportTypes")}
              </dt>
              <dd className="mt-0.5 font-mono font-medium">
                {totalReportTypes}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("meldepflichtSchema.reportTypes.heading")}</CardTitle>
          <CardDescription>
            {t("meldepflichtSchema.reportTypes.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {incidentNotificationSchema.reportTypes.map((reportType) => (
              <li
                key={reportType}
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span className="font-medium">
                  {t(`meldepflichtSchema.reportTypes.${reportType}`)}
                </span>
                <a
                  href={REPORT_TYPE_DPV_URI[reportType]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {REPORT_TYPE_DPV_URI[reportType]}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {SECTION_ORDER.map((sectionId) => {
        const group = grouped.find((g) => g.section === sectionId);
        if (!group || group.fields.length === 0) return null;
        return (
          <section key={sectionId} className="space-y-4">
            <header className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                {t(`meldepflichtSchema.sectionTitles.${sectionId}`)}
              </h2>
              <span className="text-xs text-muted-foreground">
                {group.fields.length}{" "}
                {t("meldepflichtSchema.meta_panel.fields").toLowerCase()}
              </span>
            </header>
            <div className="space-y-3">
              {group.fields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  locale={locale}
                  legalBasisLabel={t("meldepflichtSchema.field.legalBasis")}
                  nationalLabel={t("meldepflichtSchema.field.national")}
                  overlapLabel={t("meldepflichtSchema.field.overlap")}
                  dpvLabel={t("meldepflichtSchema.field.dpv")}
                  conditionalLabel={t("meldepflichtSchema.field.conditional")}
                />
              ))}
            </div>
          </section>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>{t("meldepflichtSchema.useNote.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("meldepflichtSchema.useNote.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("meldepflichtSchema.useNote.p2")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("meldepflichtSchema.ctaCard.heading")}</CardTitle>
          <CardDescription>
            {t("meldepflichtSchema.ctaCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("meldepflichtSchema.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldCard({
  field,
  locale,
  legalBasisLabel,
  nationalLabel,
  overlapLabel,
  dpvLabel,
  conditionalLabel,
}: {
  field: IncidentField;
  locale: string;
  legalBasisLabel: string;
  nationalLabel: string;
  overlapLabel: string;
  dpvLabel: string;
  conditionalLabel: string;
}) {
  const label = pickLocaleString(field.label, locale);
  const description = pickLocaleString(field.description, locale);
  const isConditional = field.appliesIf !== undefined;
  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold">{label}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="font-mono text-[10px]">
              {field.type}
            </Badge>
            {field.requiredIn.length > 0 && (
              <Badge variant="default" className="text-[10px]">
                {field.requiredIn.length}× required
              </Badge>
            )}
            {isConditional && (
              <Badge variant="secondary" className="text-[10px]">
                {conditionalLabel}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <p>
            <span className="text-muted-foreground/70">{legalBasisLabel}:</span>{" "}
            {field.legalBasis.map((basis, idx) => (
              <span key={basis.citation}>
                {idx > 0 && ", "}
                {basis.url ? (
                  <a
                    href={basis.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono underline-offset-2 hover:underline"
                  >
                    {basis.citation}
                  </a>
                ) : (
                  <span className="font-mono">{basis.citation}</span>
                )}
              </span>
            ))}
          </p>
          {field.nationalPortalMappings.length > 0 && (
            <p>
              <span className="text-muted-foreground/70">{nationalLabel}:</span>{" "}
              {field.nationalPortalMappings.map((mapping, idx) => (
                <span key={mapping.countryCode} className="font-mono">
                  {idx > 0 && ", "}
                  {mapping.countryCode}: {mapping.portalScreen}
                  {mapping.portalFieldName
                    ? ` / ${mapping.portalFieldName}`
                    : ""}
                </span>
              ))}
            </p>
          )}
          {field.crossRegulationOverlaps.length > 0 && (
            <p>
              <span className="text-muted-foreground/70">{overlapLabel}:</span>{" "}
              {field.crossRegulationOverlaps.map((overlap, idx) => (
                <span key={overlap.instrument} className="font-mono">
                  {idx > 0 && ", "}
                  {overlap.instrument}
                </span>
              ))}
            </p>
          )}
          {field.w3cDpvUri && (
            <p>
              <span className="text-muted-foreground/70">{dpvLabel}:</span>{" "}
              <a
                href={field.w3cDpvUri}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline-offset-2 hover:underline"
              >
                {field.w3cDpvUri}
              </a>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
