import { Document, Page, Text, View } from "@react-pdf/renderer";
import type React from "react";
import type { CompanyExport } from "@/lib/export/company-export";
import {
  extraRows,
  fieldRows,
  REGISTERS,
  type Row,
  shown,
  titleOf,
  type Words,
} from "@/lib/export/rows";
import type { ExportNames } from "@/lib/export/value-names";
import {
  BrandBands,
  CoverFooter,
  CoverHeading,
  DocHeader,
  FieldRow,
  PageFooter,
  SectionHeading,
} from "./chrome";
import { exportLabels } from "./export-labels";
import { formatReportDate, formatSigner, type PdfLocale } from "./format";
import { MarkdownBlocks } from "./markdown";
import { styles } from "./styles";

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
function RecordBlock({ title, rows }: { title: string; rows: readonly Row[] }) {
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
  names: ExportNames;
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
  names: ExportNames;
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
