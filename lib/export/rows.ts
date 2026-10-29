/**
 * How an export prints a record, whatever renders it: the PDFs (lib/pdf) and the complete export
 * page (components/export) read the same rows, so a field reads the same on paper and on screen.
 */
import type { JourneyEntry } from "@/lib/durchgang";
import { humanize } from "@/lib/forms/schema-introspect";
import type { ExportLabels } from "@/lib/pdf/export-labels";
import { formatFieldValue, formatReportDate, type PdfLocale } from "@/lib/pdf/format";
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

export type Listed = Exclude<ExportRecord, "company">;

/** The names of a field's coded values: the register's own first, then the shared ones. */
const codesOf = (
  field: string,
  names: ExportNames,
  register: Listed | undefined,
): Readonly<Record<string, string>> | undefined =>
  (register && names.registerValues[register]?.[field]) ||
  (isCoded(field, names) ? names.values[field] : undefined);

/**
 * A stored value as printed, or null when there is nothing to print. `register` names the record
 * the value belongs to, for the codes it names its own way.
 */
export function shown(
  field: string,
  value: unknown,
  { labels, names, locale }: Words,
  register?: Listed,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  const codes = codesOf(field, names, register);
  const named = (v: unknown) => (typeof v === "string" ? (codes?.[v] ?? v) : String(v));
  if (Array.isArray(value)) return value.length > 0 ? value.map(named).join(", ") : null;
  if (value instanceof Date) return formatReportDate(value, locale);
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (typeof value === "string" && codes) return named(value);
  return formatFieldValue(value, "text", locale);
}

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
  { record: "vulnerability", rows: (d) => d.vulnerabilities },
  { record: "patch", rows: (d) => d.patches },
  { record: "change", rows: (d) => d.changes },
  { record: "exercise", rows: (d) => d.exercises },
  { record: "improvement", rows: (d) => d.improvements },
  { record: "internalAudit", rows: (d) => d.internalAudits },
  { record: "kpi", rows: (d) => d.kpis },
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
  const register = record === "company" ? undefined : record;
  const names: Readonly<Record<string, string>> = register
    ? words.names.fields[register]
    : words.labels.company;
  return EXPORT_FIELDS[record]
    .filter((field) => !omit.includes(field))
    .map(
      (field) =>
        [
          names[field] ?? humanize(field),
          shown(field, values.get(field), words, register),
        ] as const,
    );
}

/**
 * A record's heading: its name or title. A management training the walk entered carries the
 * walk's title in the language of whoever entered it, so that title prints in the export's.
 */
export const titleOf = (
  row: object,
  names: Pick<ExportNames, "managementTraining">,
): string => {
  const values = new Map(Object.entries(row));
  const title = values.get("name") ?? values.get("title");
  if (typeof title !== "string") return "";
  return names.managementTraining.stored.includes(title)
    ? names.managementTraining.name
    : title;
};

/**
 * What a register row lists beyond its fields: an asset's providers, and for a process that must
 * keep running the systems and rooms it needs (4.2).
 */
export const extraRows = (row: object, words: Words): Row[] => {
  const values = new Map(Object.entries(row));
  const providers = values.get("providers");
  const needs = values.get("needs");
  return [
    ...(Array.isArray(providers)
      ? [[words.labels.providers, shown("providers", providers, words)] as const]
      : []),
    ...(Array.isArray(needs) && needs.length > 0
      ? [[words.labels.needs, shown("needs", needs, words)] as const]
      : []),
  ];
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
  // A list is clipped once as a whole, like any long answer (formatFieldValue).
  if (Array.isArray(value))
    return [
      label,
      value.length > 0
        ? formatFieldValue(value.map(named).join(", "), "text", locale)
        : null,
    ];
  return [label, named(value)];
}

export type StatusKind = "approved" | "notApplicable" | "notRequired" | "open";

/**
 * Where a requirement stands, as a reader of the status table would sort it: signed off (itself,
 * or met inside a walk step that was signed off), decided not applicable, not asked of the
 * company by any statute, or open. Its words are `requirementStatusLabel`'s.
 */
export const statusKind = (req: JourneyEntry): StatusKind => {
  if (req.coveredBy?.kind === "not_required") return "notRequired";
  if (req.state === "signed") return "approved";
  if (req.state === "na") return "notApplicable";
  return "open";
};

/** How many requirements stand where (`statusKind`). */
export const statusCounts = (
  reqs: ReadonlyArray<JourneyEntry>,
): Readonly<Record<StatusKind, number>> => {
  const kinds = reqs.map(statusKind);
  const count = (kind: StatusKind) => kinds.filter((k) => k === kind).length;
  return {
    approved: count("approved"),
    notApplicable: count("notApplicable"),
    notRequired: count("notRequired"),
    open: count("open"),
  };
};
