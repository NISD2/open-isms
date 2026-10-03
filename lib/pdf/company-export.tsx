import { Document, Page, Text, View } from "@react-pdf/renderer";
import type React from "react";
import {
  type CompanyExport,
  EXPORT_FIELDS,
  type ExportRecord,
} from "@/lib/export/company-export";
import {
  BrandBands,
  CoverFooter,
  CoverHeading,
  DocHeader,
  FieldRow,
  PageFooter,
  SectionHeading,
} from "./chrome";
import { type ExportLabels, exportLabels } from "./export-labels";
import {
  formatFieldValue,
  formatReportDate,
  formatSigner,
  type PdfLocale,
} from "./format";
import { MarkdownBlocks } from "./markdown";
import { styles } from "./styles";

/** Fields whose stored value is a code with a name in the labels, not the company's own words. */
const CODED: ReadonlySet<string> = new Set([
  "entityType",
  "riskLevel",
  "treatment",
  "severity",
  "approverRole",
]);

/** A stored value as printed, or null when there is nothing to print. */
function shown(
  field: string,
  value: unknown,
  labels: ExportLabels,
  locale: PdfLocale,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : null;
  if (value instanceof Date) return formatReportDate(value, locale);
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (typeof value === "string" && CODED.has(field)) return labels.values[value] ?? value;
  return formatFieldValue(value, "text", locale);
}

function Cover({
  eyebrow,
  title,
  data,
  meta,
  labels,
  locale,
}: {
  eyebrow: string;
  title: string;
  data: CompanyExport;
  meta: { label: string; value: string }[];
  labels: ExportLabels;
  locale: PdfLocale;
}) {
  return (
    <Page size="A4" style={[styles.page, styles.coverPage]}>
      <BrandBands />
      <DocHeader label={labels.asOf} value={formatReportDate(data.exportedAt, locale)} />
      <View style={styles.coverBody}>
        <CoverHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={data.company.name}
          meta={meta}
        />
      </View>
      <CoverFooter issuedByLabel={labels.issuedBy} disclaimer={labels.confidential} />
    </Page>
  );
}

/** A page of the export, with the report's furniture: bands, header, numbered footer. */
function Sheet({
  title,
  label,
  data,
  labels,
  children,
}: {
  title: string;
  label: string;
  data: CompanyExport;
  labels: ExportLabels;
  children: React.ReactNode;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <BrandBands />
      <View fixed>
        <DocHeader label={label} value="NIS 2" />
      </View>
      <SectionHeading title={title} />
      <View style={{ marginTop: 10 }}>{children}</View>
      <PageFooter context={`${data.company.name} · ${label}`} pageLabel={labels.page} />
    </Page>
  );
}

/** One record as a block: its title, then every field that holds something. */
function Record({
  title,
  rows,
}: {
  title: string;
  rows: readonly (readonly [string, string | null])[];
}) {
  return (
    <View style={styles.record} wrap={false}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{title}</Text>
      </View>
      {rows.flatMap(([label, value]) =>
        value === null ? [] : [<FieldRow key={label} label={label} value={value} />],
      )}
    </View>
  );
}

type Listed = Exclude<ExportRecord, "company">;

const REGISTERS: ReadonlyArray<{
  readonly record: Listed;
  readonly rows: (data: CompanyExport) => ReadonlyArray<object>;
}> = [
  { record: "asset", rows: (d) => d.assets },
  { record: "supplier", rows: (d) => d.suppliers },
  { record: "risk", rows: (d) => d.risks },
  { record: "training", rows: (d) => d.trainings },
  { record: "managementReview", rows: (d) => d.managementReviews },
  { record: "incident", rows: (d) => d.incidents },
];

function fieldRows(
  record: ExportRecord,
  row: object,
  labels: ExportLabels,
  locale: PdfLocale,
): (readonly [string, string | null])[] {
  const values = new Map(Object.entries(row));
  const names: Readonly<Record<string, string>> = labels.fields[record];
  return EXPORT_FIELDS[record].map(
    (field) =>
      [names[field] ?? field, shown(field, values.get(field), labels, locale)] as const,
  );
}

const titleOf = (row: object): string => {
  const values = new Map(Object.entries(row));
  const title = values.get("name") ?? values.get("title");
  return typeof title === "string" ? title : "";
};

/**
 * The registers the walk writes into, one section each: the company's master data, assets with
 * their providers, suppliers, risks, trainings, management reviews and incidents.
 */
export function RegistersDocument({
  data,
  locale,
}: {
  data: CompanyExport;
  locale: PdfLocale;
}) {
  const labels = exportLabels(locale);
  return (
    <Document
      title={`${labels.registers.title}: ${data.company.name}`}
      author={data.company.name}
    >
      <Cover
        eyebrow={labels.registers.eyebrow}
        title={labels.registers.title}
        data={data}
        labels={labels}
        locale={locale}
        meta={REGISTERS.map(({ record, rows }) => ({
          label: labels.records[record],
          value: String(rows(data).length),
        }))}
      />
      <Sheet
        title={labels.records.company}
        label={labels.registers.title}
        data={data}
        labels={labels}
      >
        <Record
          title={data.company.name}
          rows={fieldRows("company", data.company, labels, locale)}
        />
      </Sheet>
      {REGISTERS.map(({ record, rows }) => (
        <Sheet
          key={record}
          title={labels.records[record]}
          label={labels.registers.title}
          data={data}
          labels={labels}
        >
          {rows(data).length === 0 ? (
            <Text style={styles.sectionNote}>{labels.none}</Text>
          ) : (
            rows(data).map((row, i) => {
              const providers = new Map(Object.entries(row)).get("providers");
              return (
                <Record
                  key={i}
                  title={titleOf(row)}
                  rows={[
                    ...fieldRows(record, row, labels, locale),
                    ...(Array.isArray(providers)
                      ? [
                          [
                            labels.providers,
                            shown("providers", providers, labels, locale),
                          ] as const,
                        ]
                      : []),
                  ]}
                />
              );
            })
          )}
        </Sheet>
      ))}
    </Document>
  );
}

/**
 * The documents the walk wrote, each as management approved it: who approved it, when, in which
 * role and version, then the text itself. A draft says it is one.
 */
export function DocumentsDocument({
  data,
  locale,
}: {
  data: CompanyExport;
  locale: PdfLocale;
}) {
  const labels = exportLabels(locale);
  const t = labels.documents;
  return (
    <Document title={`${t.title}: ${data.company.name}`} author={data.company.name}>
      <Cover
        eyebrow={t.eyebrow}
        title={t.title}
        data={data}
        labels={labels}
        locale={locale}
        meta={data.documents.map((d) => ({
          label: d.title,
          value: d.status === "approved" ? t.approved : t.draft,
        }))}
      />
      {data.documents.length === 0 ? (
        <Sheet title={t.title} label={t.title} data={data} labels={labels}>
          <Text style={styles.sectionNote}>{t.empty}</Text>
        </Sheet>
      ) : (
        data.documents.map((d) => (
          <Sheet key={d.type} title={d.title} label={t.title} data={data} labels={labels}>
            <Record
              title={d.status === "approved" ? t.approved : t.draft}
              rows={[
                [
                  t.approvedBy,
                  formatSigner(
                    d.approver,
                    shown("approverRole", d.approverRole, labels, locale),
                  ),
                ],
                [t.approvedAt, shown("approvedAt", d.approvedAt, labels, locale)],
                [t.version, d.status === "approved" ? d.version : null],
                [
                  t.effectiveFrom,
                  shown("effectiveFrom", d.effectiveFrom, labels, locale),
                ],
              ]}
            />
            <View style={{ marginTop: 8 }}>
              <MarkdownBlocks source={d.content ?? ""} titled />
            </View>
          </Sheet>
        ))
      )}
    </Document>
  );
}
