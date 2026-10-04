import {
  groupBySection,
  type SupplierField,
  supplierQuestionnaire,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pickLocalized } from "@/lib/locale";
import {
  EXPORT_STRINGS,
  type ExportStrings,
  type QuestionnaireLocale,
  requiredLabel,
  SECTION_TITLES,
} from "@/lib/supplier-questionnaire-export-strings";
import {
  conditionText,
  isoText,
  QUESTIONNAIRE_COUNTS,
  SECTION_ORDER,
} from "@/lib/supplier-questionnaire-text";
import {
  BrandBands,
  CoverFooter,
  CoverHeading,
  DocHeader,
  PageFooter,
  SectionHeading,
} from "./chrome";
import { styles } from "./styles";
import { BRAND } from "./theme";

export {
  QUESTIONNAIRE_LOCALES,
  type QuestionnaireLocale,
} from "@/lib/supplier-questionnaire-export-strings";

/**
 * The public supplier questionnaire, as a PDF.
 *
 * Ported from hand-drawn pdfkit to react-pdf so it is built from the same
 * lib/pdf primitives as the certificate and the reports. Two things came free
 * with the move: the document now looks like the product it is downloaded
 * from, and it renders Polish. pdfkit was drawing in the base-14 Helvetica,
 * whose WinAnsi encoding has no ł, ż or ś, so the Polish edition had been
 * shipping with holes in it.
 */

const VERSION = supplierQuestionnaire.version;
const LAST_UPDATED = supplierQuestionnaire.lastUpdated;

/**
 * One question. The label leads, the provenance sits under it in the small
 * uppercase style the rest of the set uses for metadata, then the condition it
 * is asked under, the description, and for a choice question its options with
 * a circle to tick. Kept whole across page breaks so a legal basis never ends
 * up on a different sheet from the field it justifies.
 */
function Field({
  field,
  locale,
  strings,
}: {
  field: SupplierField;
  locale: QuestionnaireLocale;
  strings: ExportStrings;
}) {
  const provenance = [
    field.type,
    requiredLabel(field, strings),
    `${strings.legalBasis}: ${field.legalBasis}`,
    isoText(field),
  ]
    .filter(Boolean)
    .join(" · ");
  const condition = conditionText(field, locale, strings);
  return (
    <View style={styles.record} wrap={false}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{pickLocalized(field.label, locale)}</Text>
      </View>
      <Text style={styles.subheading}>{provenance}</Text>
      {condition && (
        <Text style={[styles.sectionNote, { marginTop: 0, marginBottom: 4 }]}>
          {condition}
        </Text>
      )}
      <Text style={styles.prose}>{pickLocalized(field.description, locale)}</Text>
      {field.options?.map((option) => (
        <View key={option.value} style={{ flexDirection: "row", gap: 5, marginTop: 3 }}>
          <View
            style={{
              width: 7,
              height: 7,
              marginTop: 2.5,
              borderRadius: 3.5,
              borderWidth: 0.75,
              borderColor: BRAND.muted,
            }}
          />
          <Text style={styles.prose}>{pickLocalized(option.label, locale)}</Text>
        </View>
      ))}
    </View>
  );
}

export function SupplierQuestionnaireDocument({
  locale,
}: {
  locale: QuestionnaireLocale;
}) {
  const strings = EXPORT_STRINGS[locale];
  const grouped = groupBySection(supplierQuestionnaire);
  const sections = SECTION_ORDER.map((id) => ({
    id,
    title: SECTION_TITLES[id][locale],
    fields: grouped.get(id) ?? [],
  })).filter((section) => section.fields.length > 0);

  return (
    <Document
      title={strings.title}
      author="NISD2.eu"
      subject={strings.subtitle}
      keywords="NIS2, supply chain, supplier, questionnaire, due diligence"
    >
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <BrandBands />
        <DocHeader label="Version" value={`${VERSION} · ${LAST_UPDATED}`} />

        <View style={styles.coverBody}>
          <CoverHeading
            eyebrow="NIS 2 Art. 21(2)(d)"
            title={strings.title}
            subtitle={strings.subtitle}
            meta={sections.map((section) => ({
              label: section.title,
              value: strings.fieldCount(section.fields.length),
            }))}
          />

          <Text style={[styles.sectionNote, { marginTop: 20 }]}>
            {strings.intro(QUESTIONNAIRE_COUNTS)}
          </Text>
          <Text style={[styles.sectionNote, { marginTop: 8, color: BRAND.faint }]}>
            {strings.source}
          </Text>
        </View>

        <CoverFooter issuedByLabel="Open source" disclaimer={strings.license} />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandBands />
        <View fixed>
          <DocHeader label="Version" value={`${VERSION} · ${LAST_UPDATED}`} />
        </View>

        {sections.map((section, i) => (
          <View key={section.id}>
            <SectionHeading
              title={`${i + 1}. ${section.title}`}
              right={
                <Text style={styles.sectionCode}>
                  {strings.fieldCount(section.fields.length)}
                </Text>
              }
            />
            {section.fields.map((field) => (
              <Field key={field.id} field={field} locale={locale} strings={strings} />
            ))}
          </View>
        ))}

        <PageFooter context={strings.title} />
      </Page>
    </Document>
  );
}
