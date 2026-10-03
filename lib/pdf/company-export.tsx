import { Document, Page, Text, View } from "@react-pdf/renderer";
import type React from "react";
import {
  type CompanyExport,
  EXPORT_FIELDS,
  type ExportRecord,
} from "@/lib/export/company-export";
import type { CodedField, ValueNames } from "@/lib/export/value-names";
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

/** How the export prints: its own words, and the app's names for stored codes. */
interface Words {
  readonly labels: ExportLabels;
  readonly names: ValueNames;
  readonly locale: PdfLocale;
}

const isCoded = (field: string, names: ValueNames): field is CodedField =>
  Object.hasOwn(names, field);

/** A stored value as printed, or null when there is nothing to print. */
function shown(
  field: string,
  value: unknown,
  { labels, names, locale }: Words,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : null;
  if (value instanceof Date) return formatReportDate(value, locale);
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (typeof value === "string" && isCoded(field, names)) {
    return names[field][value] ?? value;
  }
  return formatFieldValue(value, "text", locale);
}

function Cover({
  eyebrow,
  title,
  data,
  meta,
  words,
}: {
  eyebrow: string;
  title: string;
  data: CompanyExport;
  meta: { label: string; value: string }[];
  words: Words;
}) {
  return (
    <Page size="A4" style={[styles.page, styles.coverPage]}>
      <BrandBands />
      <DocHeader
        label={words.labels.asOf}
        value={formatReportDate(data.exportedAt, words.locale)}
      />
      <View style={styles.coverBody}>
        <CoverHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={data.company.name}
          meta={meta}
        />
      </View>
      <CoverFooter
        issuedByLabel={words.labels.issuedBy}
        disclaimer={words.labels.confidential}
      />
    </Page>
  );
}

/** A page of the export, with the report's furniture: bands, header, numbered footer. */
function Sheet({
  title,
  label,
  data,
  words,
  children,
}: {
  title: string;
  label: string;
  data: CompanyExport;
  words: Words;
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
      <PageFooter
        context={`${data.company.name} · ${label}`}
        pageLabel={words.labels.page}
      />
    </Page>
  );
}

/** One record as a block: its title, then every field that holds something. */
function RecordBlock({
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
  words: Words,
): (readonly [string, string | null])[] {
  const values = new Map(Object.entries(row));
  const names: Readonly<Record<string, string>> = words.labels.fields[record];
  return EXPORT_FIELDS[record].map(
    (field) => [names[field] ?? field, shown(field, values.get(field), words)] as const,
  );
}

const titleOf = (row: object): string => {
  const values = new Map(Object.entries(row));
  const title = values.get("name") ?? values.get("title");
  return typeof title === "string" ? title : "";
};

/** What a register row lists beyond its fields: an asset's providers. */
const extraRows = (row: object, words: Words): (readonly [string, string | null])[] => {
  const providers = new Map(Object.entries(row)).get("providers");
  return Array.isArray(providers)
    ? [[words.labels.providers, shown("providers", providers, words)]]
    : [];
};

/**
 * The registers the walk writes into, one section each: the company's master data, assets with
 * their providers, suppliers, risks, trainings, management reviews and incidents.
 */
export function RegistersDocument({
  data,
  locale,
  names,
}: {
  data: CompanyExport;
  locale: PdfLocale;
  names: ValueNames;
}) {
  const words: Words = { labels: exportLabels(locale), names, locale };
  const { labels } = words;
  return (
    <Document
      title={`${labels.registers.title}: ${data.company.name}`}
      author={data.company.name}
    >
      <Cover
        eyebrow={labels.registers.eyebrow}
        title={labels.registers.title}
        data={data}
        words={words}
        meta={REGISTERS.map(({ record, rows }) => ({
          label: labels.records[record],
          value: String(rows(data).length),
        }))}
      />
      <Sheet
        title={labels.records.company}
        label={labels.registers.title}
        data={data}
        words={words}
      >
        <RecordBlock
          title={data.company.name}
          rows={fieldRows("company", data.company, words)}
        />
      </Sheet>
      {REGISTERS.map(({ record, rows }) => (
        <Sheet
          key={record}
          title={labels.records[record]}
          label={labels.registers.title}
          data={data}
          words={words}
        >
          {rows(data).length === 0 ? (
            <Text style={styles.sectionNote}>{labels.none}</Text>
          ) : (
            rows(data).map((row, i) => (
              <RecordBlock
                key={i}
                title={titleOf(row)}
                rows={[...fieldRows(record, row, words), ...extraRows(row, words)]}
              />
            ))
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
  names,
}: {
  data: CompanyExport;
  locale: PdfLocale;
  names: ValueNames;
}) {
  const words: Words = { labels: exportLabels(locale), names, locale };
  const t = words.labels.documents;
  return (
    <Document title={`${t.title}: ${data.company.name}`} author={data.company.name}>
      <Cover
        eyebrow={t.eyebrow}
        title={t.title}
        data={data}
        words={words}
        meta={data.documents.map((d) => ({
          label: d.title,
          value: d.status === "approved" ? t.approved : t.draft,
        }))}
      />
      {data.documents.length === 0 ? (
        <Sheet title={t.title} label={t.title} data={data} words={words}>
          <Text style={styles.sectionNote}>{t.empty}</Text>
        </Sheet>
      ) : (
        data.documents.map((d) => (
          <Sheet key={d.type} title={d.title} label={t.title} data={data} words={words}>
            <RecordBlock
              title={d.status === "approved" ? t.approved : t.draft}
              rows={[
                [
                  t.approvedBy,
                  formatSigner(d.approver, shown("approverRole", d.approverRole, words)),
                ],
                [t.approvedAt, shown("approvedAt", d.approvedAt, words)],
                [t.version, d.status === "approved" ? d.version : null],
                [t.effectiveFrom, shown("effectiveFrom", d.effectiveFrom, words)],
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
