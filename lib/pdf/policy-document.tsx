import React from "react";
import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { styles } from "./styles";
import { formatFieldValue, getDateLocale } from "./format";
import { getPolicyTitle, getDocumentLabels } from "./policy-labels";
import type { PolicyData } from "./load-policy-data";

interface PolicyDocumentProps {
  data: PolicyData;
  locale: string;
}

export function PolicyDocument({ data, locale }: PolicyDocumentProps) {
  const dateLocale = getDateLocale(locale);
  const policyTitle = getPolicyTitle(data.categoryCode, locale);
  const labels = getDocumentLabels(locale);

  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <Text style={styles.coverTitle}>{policyTitle}</Text>
        <Text style={styles.coverSubtitle}>{data.companyName}</Text>
        <Text style={styles.coverMeta}>
          {labels.framework}: {data.frameworkName}
        </Text>
        <Text style={styles.coverMeta}>
          {labels.version}: 1.0
        </Text>
        <Text style={styles.coverMeta}>
          {labels.date}: {new Date().toLocaleDateString(dateLocale)}
        </Text>

        {data.signedOffBy && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{labels.signedOff}</Text>
              <Text style={styles.fieldValue}>
                {data.signedOffBy}
                {data.signedOffAt &&
                  ` — ${new Date(data.signedOffAt).toLocaleDateString(dateLocale)}`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text>{data.companyName} — {policyTitle}</Text>
          <Text>{labels.confidential}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        {data.groups.map((group) => (
          <View key={group.code} style={styles.requirementBlock} wrap={false}>
            <View style={styles.requirementHeader}>
              <Text style={styles.requirementCode}>{group.code}</Text>
              <Text style={styles.requirementTitle}>{group.title}</Text>
            </View>

            {group.legalRef && (
              <Text style={[styles.categoryDescription, { marginBottom: 6 }]}>
                {group.legalRef}
              </Text>
            )}

            {group.fields.map((field) => (
              <View key={field.key} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>
                  {formatFieldValue(field.value, field.type, locale)}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>{data.companyName} — {policyTitle}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
