import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  BrandBands,
  CoverFooter,
  CoverHeading,
  DocHeader,
  FieldRow,
  PageFooter,
  SectionHeading,
} from "./chrome";
import { formatFieldValue, getDateLocale } from "./format";
import type { PolicyData } from "./load-policy-data";
import { getDocumentLabels, getPolicyTitle } from "./policy-labels";
import { styles } from "./styles";

interface PolicyDocumentProps {
  data: PolicyData;
  locale: string;
}

const POLICY_VERSION = "1.0";

export function PolicyDocument({ data, locale }: PolicyDocumentProps) {
  const dateLocale = getDateLocale(locale);
  const policyTitle = getPolicyTitle(data.categoryCode, locale);
  const labels = getDocumentLabels(locale);
  const today = new Date().toLocaleDateString(dateLocale);
  const footerContext = `${data.companyName} - ${policyTitle}`;

  return (
    <Document
      title={`${policyTitle}: ${data.companyName}`}
      author={data.companyName}
      subject={data.frameworkName}
    >
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <BrandBands />
        <DocHeader label={labels.version} value={`v${POLICY_VERSION}`} />

        <View style={styles.coverBody}>
          <CoverHeading
            eyebrow={data.frameworkName}
            title={policyTitle}
            subtitle={data.companyName}
            meta={[
              { label: labels.framework, value: data.frameworkName },
              { label: labels.version, value: POLICY_VERSION },
              { label: labels.date, value: today },
              ...(data.signedOffBy
                ? [
                    {
                      label: labels.signedOff,
                      value: data.signedOffAt
                        ? `${data.signedOffBy} - ${new Date(data.signedOffAt).toLocaleDateString(dateLocale)}`
                        : data.signedOffBy,
                    },
                  ]
                : []),
            ]}
          />
        </View>

        <CoverFooter
          issuedByLabel={labels.generatedWith}
          disclaimer={labels.confidential}
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandBands />
        <View fixed>
          <DocHeader label={labels.version} value={`v${POLICY_VERSION}`} />
        </View>

        {data.groups.map((group) => (
          <View key={group.code} wrap={false}>
            <SectionHeading code={group.code} title={group.title} />
            {group.legalRef && <Text style={styles.sectionNote}>{group.legalRef}</Text>}
            <View style={styles.record}>
              {group.fields.map((field) => (
                <FieldRow
                  key={field.key}
                  label={field.label}
                  value={formatFieldValue(field.value, field.type, locale)}
                />
              ))}
            </View>
          </View>
        ))}

        <PageFooter context={footerContext} pageLabel={labels.page} />
      </Page>
    </Document>
  );
}
