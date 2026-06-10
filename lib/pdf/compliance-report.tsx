import React from "react";
import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { styles } from "./styles";
import { formatFieldValue, getDateLocale } from "./format";
import { humanize } from "@/lib/forms/schema-introspect";
import type { ReportData, ReportRequirement } from "./load-report-data";

interface ComplianceReportProps {
  data: ReportData;
  locale: string;
}

function StatusBadge({ status }: { status: string }) {
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
      {status.replace("_", " ")}
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

  return (
    <View style={styles.requirementBlock} wrap={false}>
      <View style={styles.requirementHeader}>
        <Text style={styles.requirementCode}>{req.code}</Text>
        <Text style={styles.requirementTitle}>{req.title}</Text>
        <StatusBadge status={req.status} />
      </View>

      {/* Sign-off data */}
      {req.signedOffRole && (
        <View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Signed off by</Text>
            <Text style={styles.fieldValue}>{req.signedOffRole}</Text>
          </View>
          {req.signedOffAt && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Signed off at</Text>
              <Text style={styles.fieldValue}>
                {new Date(req.signedOffAt).toLocaleDateString(dateLocale)}
              </Text>
            </View>
          )}
          {req.signOffSnapshot?.templateVersion && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Template version</Text>
              <Text style={styles.fieldValue}>v{req.signOffSnapshot.templateVersion}</Text>
            </View>
          )}
          {req.signOffSnapshot?.derivedData && Object.keys(req.signOffSnapshot.derivedData).length > 0 && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Operational data</Text>
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
          <Text style={styles.sectionLabel}>Evidence Files</Text>
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
          <Text style={styles.feedbackLabel}>Reviewer Feedback</Text>
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

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <Text style={styles.coverTitle}>Compliance Report</Text>
        <Text style={styles.coverSubtitle}>{data.frameworkName}</Text>
        <Text style={styles.coverMeta}>{data.companyName}</Text>
        {data.companySector && (
          <Text style={styles.coverMeta}>Sector: {data.companySector}</Text>
        )}
        <Text style={styles.coverMeta}>
          Generated: {new Date().toLocaleDateString(getDateLocale(locale))}
        </Text>
        <Text style={styles.coverMeta}>
          Assessment started:{" "}
          {data.assessmentDate.toLocaleDateString(getDateLocale(locale))}
        </Text>

        {unapprovedCount > 0 && (
          <View style={styles.draftBanner}>
            <Text style={styles.draftTitle}>
              DRAFT — Contains unapproved submissions
            </Text>
            <Text style={styles.draftText}>
              {unapprovedCount} of {data.completedCount} completed items are
              pending reviewer approval.
            </Text>
          </View>
        )}

        <View style={[styles.statsRow, { marginTop: unapprovedCount > 0 ? 12 : 40 }]}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{percentage}%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.approvedCount}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          {unapprovedCount > 0 && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{unapprovedCount}</Text>
              <Text style={styles.statLabel}>Pending Approval</Text>
            </View>
          )}
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.totalRequirements}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Compliance Report — {data.companyName}</Text>
          <Text>Confidential</Text>
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
              <Text style={styles.sectionLabel}>Category Intake</Text>
              {cat.intakeSignedOffAt && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Signed off</Text>
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
            <Text>{data.companyName} — {data.frameworkName}</Text>
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

