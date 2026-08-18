import React from "react";
import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { styles } from "./styles";
import { formatFieldValue, getDateLocale } from "./format";
import {
  getDocumentLabels,
  getReportLabels,
  getStatusLabel,
} from "./policy-labels";
import { humanize } from "@/lib/forms/schema-introspect";
import type { ReportData, ReportRequirement } from "./load-report-data";

interface ComplianceReportProps {
  data: ReportData;
  locale: string;
}

function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const variantStyle =
    status === "approved"
      ? styles.statusApproved
      : status === "completed"
        ? styles.statusCompleted
        : status === "rejected"
          ? styles.statusRejected
          : styles.statusDefault;

  return (
    <Text style={[styles.statusBadge, variantStyle]}>
      {getStatusLabel(status, locale)}
    </Text>
  );
}

function RequirementSection({
  req,
  locale,
}: {
  req: ReportRequirement;
  locale: string;
}) {
  const dateLocale = getDateLocale(locale);
  const labels = getReportLabels(locale);

  return (
    <View style={styles.requirementBlock} wrap={false}>
      <View style={styles.requirementHeader}>
        <Text style={styles.requirementCode}>{req.code}</Text>
        <Text style={styles.requirementTitle}>{req.title}</Text>
        <StatusBadge status={req.status} locale={locale} />
      </View>

      {/* Sign-off data */}
      {req.signedOffRole && (
        <View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{labels.signedOffBy}</Text>
            <Text style={styles.fieldValue}>{req.signedOffRole}</Text>
          </View>
          {req.signedOffAt && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{labels.signedOffAt}</Text>
              <Text style={styles.fieldValue}>
                {new Date(req.signedOffAt).toLocaleDateString(dateLocale)}
              </Text>
            </View>
          )}
          {req.signOffSnapshot?.templateVersion && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{labels.templateVersion}</Text>
              <Text style={styles.fieldValue}>v{req.signOffSnapshot.templateVersion}</Text>
            </View>
          )}
          {req.signOffSnapshot?.derivedData && Object.keys(req.signOffSnapshot.derivedData).length > 0 && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{labels.operationalData}</Text>
              <Text style={styles.fieldValue}>
                {Object.entries(req.signOffSnapshot.derivedData)
                  .map(([key, val]) => {
                    const data = val as Record<string, unknown> | null;
                    return `${key}: ${data && typeof data === "object" && "total" in data ? data.total : JSON.stringify(val)}`;
                  })
                  .join(", ")}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Evidence files */}
      {req.evidence.length > 0 && (
        <View>
          <Text style={styles.sectionLabel}>{labels.evidenceFiles}</Text>
          {req.evidence.map((e, i) => (
            <Text key={i} style={styles.evidenceItem}>
              {e.fileName}
              {e.fileSize ? ` (${(e.fileSize / 1024).toFixed(0)} KB)` : ""}
              {" — "}
              {e.status}
            </Text>
          ))}
        </View>
      )}

      {/* Review feedback */}
      {req.reviewFeedback && (
        <View style={styles.feedbackBlock}>
          <Text style={styles.feedbackLabel}>{labels.reviewerFeedback}</Text>
          <Text style={styles.feedbackText}>{req.reviewFeedback}</Text>
        </View>
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

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <Text style={styles.coverTitle}>{labels.title}</Text>
        <Text style={styles.coverSubtitle}>{data.frameworkName}</Text>
        <Text style={styles.coverMeta}>{data.companyName}</Text>
        {data.companySector && (
          <Text style={styles.coverMeta}>{labels.sector}: {data.companySector}</Text>
        )}
        <Text style={styles.coverMeta}>
          {labels.generated}: {new Date().toLocaleDateString(getDateLocale(locale))}
        </Text>
        <Text style={styles.coverMeta}>
          {labels.assessmentStarted}:{" "}
          {data.assessmentDate.toLocaleDateString(getDateLocale(locale))}
        </Text>

        {unapprovedCount > 0 && (
          <View style={styles.draftBanner}>
            <Text style={styles.draftTitle}>{labels.draftTitle}</Text>
            <Text style={styles.draftText}>
              {labels.draftText(unapprovedCount, data.completedCount)}
            </Text>
          </View>
        )}

        <View style={[styles.statsRow, { marginTop: unapprovedCount > 0 ? 12 : 40 }]}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{percentage}%</Text>
            <Text style={styles.statLabel}>{labels.statCompliance}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.completedCount}</Text>
            <Text style={styles.statLabel}>{labels.statCompleted}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.approvedCount}</Text>
            <Text style={styles.statLabel}>{labels.statApproved}</Text>
          </View>
          {unapprovedCount > 0 && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{unapprovedCount}</Text>
              <Text style={styles.statLabel}>{labels.statPendingApproval}</Text>
            </View>
          )}
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.totalRequirements}</Text>
            <Text style={styles.statLabel}>{labels.statTotal}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>{labels.title} · {data.companyName}</Text>
          <Text>{getDocumentLabels(locale).confidential}</Text>
        </View>
      </Page>

      {/* Category Pages */}
      {data.categories.map((cat) => (
        <Page key={cat.code} size="A4" style={styles.page}>
          <View style={styles.categoryHeader}>
            <Text>
              <Text style={styles.categoryCode}>{cat.code}</Text>
              {"  "}
              {cat.name}
            </Text>
          </View>

          {cat.grundschutzModule && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>IT-Grundschutz</Text>
              <Text style={styles.fieldValue}>{cat.grundschutzModule}</Text>
            </View>
          )}

          {cat.description && (
            <Text style={styles.categoryDescription}>{cat.description}</Text>
          )}

          {cat.bsiGuidance && (
            <Text style={styles.categoryDescription}>{cat.bsiGuidance}</Text>
          )}

          {/* Intake form answers */}
          {cat.intakeAnswers && Object.keys(cat.intakeAnswers).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.sectionLabel}>{labels.categoryIntake}</Text>
              {cat.intakeSignedOffAt && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{labels.signedOff}</Text>
                  <Text style={styles.fieldValue}>
                    {new Date(cat.intakeSignedOffAt).toLocaleDateString(getDateLocale(locale))}
                  </Text>
                </View>
              )}
              {Object.entries(cat.intakeAnswers).map(([key, val]) => (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>
                    {humanize(key)}
                  </Text>
                  <Text style={styles.fieldValue}>{formatFieldValue(val, "text", locale)}</Text>
                </View>
              ))}
            </View>
          )}

          {cat.requirements.map((req) => (
            <RequirementSection key={req.code} req={req} locale={locale} />
          ))}

          <View style={styles.footer} fixed>
            <Text>{data.companyName} · {data.frameworkName}</Text>
            <Text
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </Page>
      ))}
    </Document>
  );
}

