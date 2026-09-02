import { Document, Page, Text, View } from "@react-pdf/renderer";
import { humanize } from "@/lib/forms/schema-introspect";
import {
  Badge,
  BrandBands,
  Callout,
  CoverFooter,
  CoverHeading,
  DocHeader,
  FieldRow,
  PageFooter,
  SectionHeading,
  StatPlate,
} from "./chrome";
import { formatFieldValue, getDateLocale } from "./format";
import type { ReportData, ReportRequirement } from "./load-report-data";
import { getDocumentLabels, getReportLabels, getStatusLabel } from "./policy-labels";
import { styles } from "./styles";
import type { StatusTone } from "./theme";

interface ComplianceReportProps {
  data: ReportData;
  locale: string;
}

/** Review states map onto the shared tones; anything unrecognised reads as
 *  neutral rather than inventing a colour for it. */
const STATUS_TONE: Record<string, StatusTone> = {
  approved: "approved",
  completed: "completed",
  rejected: "rejected",
};

function RequirementSection({ req, locale }: { req: ReportRequirement; locale: string }) {
  const dateLocale = getDateLocale(locale);
  const labels = getReportLabels(locale);

  return (
    <View style={styles.record} wrap={false}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordCode}>{req.code}</Text>
        <Text style={styles.recordTitle}>{req.title}</Text>
        <Badge tone={STATUS_TONE[req.status] ?? "neutral"}>
          {getStatusLabel(req.status, locale)}
        </Badge>
      </View>

      {req.signedOffRole && (
        <View>
          <FieldRow label={labels.signedOffBy} value={req.signedOffRole} />
          {req.signedOffAt && (
            <FieldRow
              label={labels.signedOffAt}
              value={new Date(req.signedOffAt).toLocaleDateString(dateLocale)}
            />
          )}
          {req.signOffSnapshot?.templateVersion && (
            <FieldRow
              label={labels.templateVersion}
              value={`v${req.signOffSnapshot.templateVersion}`}
            />
          )}
          {req.signOffSnapshot?.derivedData &&
            Object.keys(req.signOffSnapshot.derivedData).length > 0 && (
              <FieldRow
                label={labels.operationalData}
                value={Object.entries(req.signOffSnapshot.derivedData)
                  .map(([key, val]) => {
                    const entry = val as Record<string, unknown> | null;
                    const total =
                      entry && typeof entry === "object" && "total" in entry
                        ? entry.total
                        : JSON.stringify(val);
                    return `${key}: ${total}`;
                  })
                  .join(", ")}
              />
            )}
        </View>
      )}

      {req.evidence.length > 0 && (
        <View>
          <Text style={styles.subheading}>{labels.evidenceFiles}</Text>
          {req.evidence.map((e, i) => (
            <Text key={i} style={styles.prose}>
              {e.fileName}
              {e.fileSize ? ` (${(e.fileSize / 1024).toFixed(0)} KB)` : ""}
              {" - "}
              {e.status}
            </Text>
          ))}
        </View>
      )}

      {req.reviewFeedback && (
        <Callout tone="alert" title={labels.reviewerFeedback}>
          {req.reviewFeedback}
        </Callout>
      )}
    </View>
  );
}

export function ComplianceReport({ data, locale }: ComplianceReportProps) {
  const percentage =
    data.totalRequirements > 0
      ? ((data.completedCount / data.totalRequirements) * 100).toFixed(0)
      : "0";

  const unapprovedCount = data.completedCount - data.approvedCount;
  const labels = getReportLabels(locale);
  const docLabels = getDocumentLabels(locale);
  const dateLocale = getDateLocale(locale);
  const footerContext = `${data.companyName} - ${data.frameworkName}`;

  const stats = [
    { value: `${percentage}%`, label: labels.statCompliance },
    { value: String(data.completedCount), label: labels.statCompleted },
    { value: String(data.approvedCount), label: labels.statApproved },
    ...(unapprovedCount > 0
      ? [{ value: String(unapprovedCount), label: labels.statPendingApproval }]
      : []),
    { value: String(data.totalRequirements), label: labels.statTotal },
  ];

  return (
    <Document
      title={`${labels.title}: ${data.companyName}`}
      author="NISD2.eu"
      subject={data.frameworkName}
    >
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <BrandBands />
        <DocHeader
          label={labels.generated}
          value={new Date().toLocaleDateString(dateLocale)}
        />

        <View style={styles.coverBody}>
          <CoverHeading
            eyebrow={data.frameworkName}
            title={labels.title}
            subtitle={data.companyName}
            meta={[
              ...(data.companySector
                ? [{ label: labels.sector, value: data.companySector }]
                : []),
              {
                label: labels.assessmentStarted,
                value: data.assessmentDate.toLocaleDateString(dateLocale),
              },
              {
                label: labels.generated,
                value: new Date().toLocaleDateString(dateLocale),
              },
            ]}
          />

          <StatPlate stats={stats} />

          {unapprovedCount > 0 && (
            <Callout tone="caution" title={labels.draftTitle}>
              {labels.draftText(unapprovedCount, data.completedCount)}
            </Callout>
          )}
        </View>

        <CoverFooter
          issuedByLabel={docLabels.generatedWith}
          disclaimer={docLabels.confidential}
        />
      </Page>

      {data.categories.map((cat) => (
        <Page key={cat.code} size="A4" style={styles.page}>
          <BrandBands />
          <View fixed>
            <DocHeader label={labels.title} value={cat.code} />
          </View>

          <SectionHeading code={cat.code} title={cat.name} />

          {cat.grundschutzModule && (
            <FieldRow label="IT-Grundschutz" value={cat.grundschutzModule} />
          )}

          {cat.description && <Text style={styles.sectionNote}>{cat.description}</Text>}
          {cat.bsiGuidance && <Text style={styles.sectionNote}>{cat.bsiGuidance}</Text>}

          {cat.intakeAnswers && Object.keys(cat.intakeAnswers).length > 0 && (
            <View>
              <Text style={styles.subheading}>{labels.categoryIntake}</Text>
              {cat.intakeSignedOffAt && (
                <FieldRow
                  label={labels.signedOff}
                  value={new Date(cat.intakeSignedOffAt).toLocaleDateString(dateLocale)}
                />
              )}
              {Object.entries(cat.intakeAnswers).map(([key, val]) => (
                <FieldRow
                  key={key}
                  label={humanize(key)}
                  value={formatFieldValue(val, "text", locale)}
                />
              ))}
            </View>
          )}

          {cat.requirements.map((req) => (
            <RequirementSection key={req.code} req={req} locale={locale} />
          ))}

          <PageFooter context={footerContext} pageLabel={docLabels.page} />
        </Page>
      ))}
    </Document>
  );
}
