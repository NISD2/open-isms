/**
 * How an export prints a record, whatever renders it: the PDFs (lib/pdf) and the complete export
 * page (components/export) read the same rows, so a field reads the same on paper and on screen.
 */
import { humanize } from "@/lib/forms/schema-introspect";
import type { ExportLabels } from "@/lib/pdf/export-labels";
import { formatFieldValue, formatReportDate, type PdfLocale } from "@/lib/pdf/format";
import type { ReportRequirement } from "@/lib/pdf/load-report-data";
import type { getReportLabels } from "@/lib/pdf/policy-labels";
import { type CompanyExport, EXPORT_FIELDS, type ExportRecord } from "./company-export";
import type { AnswerNames, CodedField, ExportNames } from "./value-names";

/** How the export prints: its own words, and the app's names for fields and stored codes. */
export interface Words {
  readonly labels: ExportLabels;
  readonly names: ExportNames;
  readonly locale: PdfLocale;
}

/** A label and the printed value, or null when the record holds nothing there. */
export type Row = readonly [string, string | null];

const isCoded = (field: string, names: ExportNames): field is CodedField =>
  Object.hasOwn(names.values, field);

/** A stored value as printed, or null when there is nothing to print. */
export function shown(
  field: string,
  value: unknown,
  { labels, names, locale }: Words,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : null;
  if (value instanceof Date) return formatReportDate(value, locale);
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (typeof value === "string" && isCoded(field, names)) {
    return names.values[field][value] ?? value;
  }
  return formatFieldValue(value, "text", locale);
}

export type Listed = Exclude<ExportRecord, "company">;

/** The registers the walk writes into, in the order the exports print them. */
export const REGISTERS: ReadonlyArray<{
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

/**
 * Every exported field of one record, labelled the way its form labels it, less the fields in
 * `omit` that the caller shows elsewhere.
 */
export function fieldRows(
  record: ExportRecord,
  row: object,
  words: Words,
  omit: readonly string[] = [],
): Row[] {
  const values = new Map(Object.entries(row));
  const names: Readonly<Record<string, string>> =
    record === "company" ? words.labels.company : words.names.fields[record];
  return EXPORT_FIELDS[record]
    .filter((field) => !omit.includes(field))
    .map(
      (field) => [names[field] ?? field, shown(field, values.get(field), words)] as const,
    );
}

export const titleOf = (row: object): string => {
  const values = new Map(Object.entries(row));
  const title = values.get("name") ?? values.get("title");
  return typeof title === "string" ? title : "";
};

/** What a register row lists beyond its fields: an asset's providers. */
export const extraRows = (row: object, words: Words): Row[] => {
  const providers = new Map(Object.entries(row)).get("providers");
  return Array.isArray(providers)
    ? [[words.labels.providers, shown("providers", providers, words)]]
    : [];
};

/**
 * An answer typed in a category, labelled and named the way the export names answers: its label
 * for that category, a choice by its name, the rest as the report prints values.
 */
export function answerRow(
  category: string,
  key: string,
  value: unknown,
  answers: AnswerNames,
  locale: PdfLocale,
): Row {
  const label = answers.labels[category]?.[key] ?? humanize(key);
  const named = (v: unknown) =>
    (typeof v === "string" ? answers.values[key]?.[v] : undefined) ??
    formatFieldValue(v, "text", locale);
  if (value === null || value === undefined || value === "") return [label, null];
  if (Array.isArray(value))
    return [label, value.length > 0 ? value.map(named).join(", ") : null];
  return [label, named(value)];
}

/** How the journey reads a requirement it does not read off its own work, or null. */
export function coverageLabel(
  covered: ReportRequirement["covered"],
  labels: ReturnType<typeof getReportLabels>,
): string | null {
  if (covered === null) return null;
  if (covered.by.kind === "not_required") return labels.notRequired;
  const codes = covered.by.codes.join(` ${labels.and} `);
  return covered.done ? labels.coveredSigned(codes) : labels.coveredAwaiting(codes);
}
