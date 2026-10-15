import {
  groupBySection,
  type IncidentField,
  incidentNotificationSchema,
  type LocalisedString,
  REPORT_TYPE_DPV_URI,
  type SectionValue,
} from "@nisd2/incident-notification-schema";
import { FileCode, Package } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { REPORTS, type Report } from "@/lib/compliance/bsig-32";
import {
  CZECH_REPORT_TEXT,
  CZECH_REPORTING_CLOCK,
  czechArticle,
  czechProvisionHref,
} from "@/lib/compliance/czech-law";
import { pickLocalized } from "@/lib/locale";
import { pageAlternates } from "@/lib/seo";

const SCHEMA_REPO_URL = "https://github.com/NISD2/nis2-incident-notification-schema";
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
    alternates: pageAlternates("nis2-meldepflicht-schema", locale),
  };
}

function pickLocaleString(value: LocalisedString, locale: string): string {
  return pickLocalized(value as Record<string, string | undefined>, locale);
}

/**
 * The schema's EU citations as a Czech reader writes them, article before instrument. The
 * package holds them in English; one it adds later reads through czechArticle until it is here.
 */
const CZECH_CITATION: Readonly<Record<string, string>> = {
  "Directive (EU) 2022/2555 (NIS 2) Art. 23": "čl. 23 směrnice (EU) 2022/2555 (NIS 2)",
  "Commission Implementing Regulation (EU) 2024/2690 (CIR)":
    "prováděcí nařízení Komise (EU) 2024/2690 (CIR)",
  "ENISA Technical Implementation Guidance v1.0 (June 2025)":
    "technické pokyny ENISA k provádění (Technical Implementation Guidance) v1.0, červen 2025",
  "NIS Cooperation Group Common Notification Templates (adopted 26 May 2026; Commission Implementing Regulation pending)":
    "společné šablony hlášení skupiny pro spolupráci NIS (přijaty 26. května 2026, prováděcí nařízení Komise se připravuje)",
  "W3C DPV NIS 2 Vocabulary v2.3 (25 February 2026)":
    "slovník W3C DPV pro NIS 2 v2.3 (25. února 2026)",
  "NIS 2 Art. 6(6)": "čl. 6 bod 6 NIS 2",
  "NIS 2 Art. 23(2)": "čl. 23 odst. 2 NIS 2",
  "NIS 2 Art. 23(3)": "čl. 23 odst. 3 NIS 2",
  "NIS 2 Art. 23(3)(a)": "čl. 23 odst. 3 písm. a) NIS 2",
  "NIS 2 Art. 23(4)": "čl. 23 odst. 4 NIS 2",
  "NIS 2 Art. 23(4)(a)": "čl. 23 odst. 4 písm. a) NIS 2",
  "NIS 2 Art. 23(4)(b)": "čl. 23 odst. 4 písm. b) NIS 2",
  "NIS 2 Art. 23(4)(d)": "čl. 23 odst. 4 písm. d) NIS 2",
  "NIS 2 Art. 23(4)(d)(i)": "čl. 23 odst. 4 písm. d) bod i) NIS 2",
  "NIS 2 Art. 23(4)(d)(ii)": "čl. 23 odst. 4 písm. d) bod ii) NIS 2",
  "NIS 2 Art. 23(4)(d)(iii)": "čl. 23 odst. 4 písm. d) bod iii) NIS 2",
  "NIS 2 Art. 23(4)(d)(iv)": "čl. 23 odst. 4 písm. d) bod iv) NIS 2",
  "NIS 2 Art. 23(5)": "čl. 23 odst. 5 NIS 2",
  "NIS 2 Art. 23(6)": "čl. 23 odst. 6 NIS 2",
  "NIS 2 Art. 30": "čl. 30 NIS 2",
  "NIS 2 Annex I": "příloha I NIS 2",
  "NIS 2 Annex II": "příloha II NIS 2",
  "CIR 2024/2690": "prováděcí nařízení (EU) 2024/2690",
  "CIR 2024/2690 (where applicable)":
    "prováděcí nařízení (EU) 2024/2690 (pokud se použije)",
  "ENISA TIG v1.0 §5 (incident timeline)":
    "ENISA TIG v1.0, oddíl 5 (časová osa incidentu)",
  "ENISA TIG v1.0 §5 (incident profiling)": "ENISA TIG v1.0, oddíl 5 (profil incidentu)",
  "ENISA TIG v1.0 §5 (detection)": "ENISA TIG v1.0, oddíl 5 (zjištění)",
  "ENISA TIG v1.0 §5 (post-incident review)":
    "ENISA TIG v1.0, oddíl 5 (přezkum po incidentu)",
  "ENISA TIG v1.0 §5 (notification logistics)":
    "ENISA TIG v1.0, oddíl 5 (organizace hlášení)",
  "GDPR Art. 32(1)": "čl. 32 odst. 1 GDPR",
  "GDPR Art. 33(1)": "čl. 33 odst. 1 GDPR",
  "GDPR Art. 33(3)(a)": "čl. 33 odst. 3 písm. a) GDPR",
  "GDPR Art. 33(3)(b)": "čl. 33 odst. 3 písm. b) GDPR",
  "GDPR Art. 33(3)(c)": "čl. 33 odst. 3 písm. c) GDPR",
  "GDPR Art. 33(3)(d)": "čl. 33 odst. 3 písm. d) GDPR",
  "GDPR Art. 34": "čl. 34 GDPR",
  "GDPR Art. 34(2)": "čl. 34 odst. 2 GDPR",
  "DORA Art. 19(1)": "čl. 19 odst. 1 DORA",
  "DORA Art. 19(4)": "čl. 19 odst. 4 DORA",
};

/** A citation as the reader's language writes it: Czech style on a Czech page, as stored elsewhere. */
const citationFor = (citation: string, locale: string): string =>
  locale === "cs" ? (CZECH_CITATION[citation] ?? czechArticle(citation)) : citation;

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
          <CardDescription>{t("meldepflichtSchema.anchors.description")}</CardDescription>
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
                    {citationFor(instrument.citation, locale)}
                  </a>
                ) : (
                  <span>{citationFor(instrument.citation, locale)}</span>
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
              <a href={SCHEMA_REPO_URL} target="_blank" rel="noopener noreferrer">
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
              <dd className="mt-0.5 font-mono font-medium">{totalReportTypes}</dd>
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

      {locale === "cs" && (
        <CzechReportingCard
          heading={t("meldepflichtSchema.czechReporting.heading")}
          description={t("meldepflichtSchema.czechReporting.description")}
          source={t("meldepflichtSchema.czechReporting.source")}
        />
      )}

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
                  requiredLabel={t("meldepflichtSchema.field.requiredCount", {
                    count: field.requiredIn.length,
                  })}
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
          <CardDescription>{t("meldepflichtSchema.ctaCard.description")}</CardDescription>
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

/**
 * On a Czech page, the reports the Czech Act asks for, beside the EU's: § 16 counts the final
 * report from the notification, and § 15 names who receives it by regime.
 */
async function CzechReportingCard({
  heading,
  description,
  source,
}: {
  heading: string;
  description: string;
  source: string;
}) {
  // The walk's clock words, read here on the server: the public pages hand the browser no
  // `durchgang` messages, so the walk's client ReportingClock would show its keys on this page.
  const clock = await getTranslations("durchgang.ui.clock");
  const when: Readonly<Record<Report, { value: string; from: string }>> = {
    early_warning: {
      value: clock("hours", { count: CZECH_REPORTING_CLOCK.initialReportHours }),
      from: clock("fromKnowledge"),
    },
    notification: {
      value: clock("hours", { count: CZECH_REPORTING_CLOCK.notificationHours }),
      from: clock("fromKnowledge"),
    },
    final_report: {
      value: clock("days", { count: CZECH_REPORTING_CLOCK.finalReportDays }),
      from: clock("fromNotification"),
    },
  };
  const href = czechProvisionHref(source);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="grid gap-3 sm:grid-cols-3">
          {REPORTS.map((report, i) => (
            <li key={report} className="rounded-lg border p-4">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
                {i + 1}
              </span>
              <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums">
                {when[report].value}
              </p>
              <p className="text-xs text-muted-foreground">{when[report].from}</p>
              <p className="mt-2 text-sm font-semibold">
                {CZECH_REPORT_TEXT[report].name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {CZECH_REPORT_TEXT[report].content}
              </p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          {href === null ? (
            source
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              {source}
            </a>
          )}
        </p>
      </CardContent>
    </Card>
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
  requiredLabel,
}: {
  field: IncidentField;
  locale: string;
  legalBasisLabel: string;
  nationalLabel: string;
  overlapLabel: string;
  dpvLabel: string;
  conditionalLabel: string;
  requiredLabel: string;
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
                {requiredLabel}
              </Badge>
            )}
            {isConditional && (
              <Badge variant="secondary" className="text-[10px]">
                {conditionalLabel}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
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
                    {citationFor(basis.citation, locale)}
                  </a>
                ) : (
                  <span className="font-mono">{citationFor(basis.citation, locale)}</span>
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
                  {mapping.portalFieldName ? ` / ${mapping.portalFieldName}` : ""}
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
                  {citationFor(overlap.instrument, locale)}
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
