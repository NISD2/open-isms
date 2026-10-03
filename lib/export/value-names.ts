import "@/lib/server-guard";

import { z } from "zod";
import type { PdfLocale } from "@/lib/pdf/format";
import type { ExportRecord } from "./company-export";

/**
 * The stored codes the export prints by name, each with the message file and key the app's own
 * screens name them from, so a file says what the screen says.
 */
const VALUE_SOURCES = {
  sector: ["organization", ["organization", "sectors"]],
  entityType: ["organization", ["organization", "entityTypes"]],
  type: ["assets", ["assets", "types"]],
  riskLevel: ["suppliers", ["suppliers", "riskLevel"]],
  treatment: ["risks", ["risks", "treatment"]],
  severity: ["incidents", ["incidents", "severity"]],
  approverRole: ["team", ["team", "roles"]],
  mfaMethod: [
    "durchgang",
    ["durchgang", "items", "11_1", "screens", "logins", "methods"],
  ],
  backupFrequency: [
    "durchgang",
    ["durchgang", "items", "4_4", "screens", "systems", "options"],
  ],
} as const satisfies Record<string, readonly [string, readonly string[]]>;

/**
 * The message file each register's form reads its field labels from, so the export names a
 * column the way the form does. Company master data is labelled by the export itself: the
 * organization form names its fields differently.
 */
const FIELD_SOURCES = {
  asset: ["assets", ["assets", "fields"]],
  supplier: ["suppliers", ["suppliers", "fields"]],
  risk: ["risks", ["risks", "fields"]],
  training: ["training", ["training", "fields"]],
  managementReview: ["management-reviews", ["managementReviews", "fields"]],
  incident: ["incidents", ["incidents", "fields"]],
} as const satisfies Record<
  Exclude<ExportRecord, "company">,
  readonly [string, readonly string[]]
>;

export type CodedField = keyof typeof VALUE_SOURCES;
export type Register = keyof typeof FIELD_SOURCES;
type Names = Readonly<Record<string, string>>;

export interface ExportNames {
  /** The name of each coded value, by field. */
  readonly values: Readonly<Record<CodedField, Names>>;
  /** Each register's field labels, by field. */
  readonly fields: Readonly<Record<Register, Names>>;
}

/** Message files are data: a map that does not parse names nothing, and the key prints. */
const NAMES = z.record(z.string(), z.string()).catch({});

/** The value under `path` in a message file's JSON, or undefined. */
const at = (json: unknown, path: readonly string[]): unknown =>
  path.reduce<unknown>(
    (node, key) =>
      typeof node === "object" && node !== null
        ? new Map(Object.entries(node)).get(key)
        : undefined,
    json,
  );

/**
 * What the export calls fields and coded values, in `locale`, read the way `lib/messages`
 * reads its files, so it works on a route and in a script alike.
 */
export async function exportNames(locale: PdfLocale): Promise<ExportNames> {
  const named = async ([file, path]: readonly [string, readonly string[]]) => {
    const json: unknown = (await import(`../../messages/${file}/${locale}.json`)).default;
    return NAMES.parse(at(json, path));
  };
  const [
    sector,
    entityType,
    type,
    riskLevel,
    treatment,
    severity,
    approverRole,
    mfaMethod,
    backupFrequency,
    asset,
    supplier,
    risk,
    training,
    managementReview,
    incident,
  ] = await Promise.all([
    named(VALUE_SOURCES.sector),
    named(VALUE_SOURCES.entityType),
    named(VALUE_SOURCES.type),
    named(VALUE_SOURCES.riskLevel),
    named(VALUE_SOURCES.treatment),
    named(VALUE_SOURCES.severity),
    named(VALUE_SOURCES.approverRole),
    named(VALUE_SOURCES.mfaMethod),
    named(VALUE_SOURCES.backupFrequency),
    named(FIELD_SOURCES.asset),
    named(FIELD_SOURCES.supplier),
    named(FIELD_SOURCES.risk),
    named(FIELD_SOURCES.training),
    named(FIELD_SOURCES.managementReview),
    named(FIELD_SOURCES.incident),
  ]);
  return {
    values: {
      sector,
      entityType,
      type,
      riskLevel,
      treatment,
      severity,
      approverRole,
      mfaMethod,
      backupFrequency,
    },
    fields: { asset, supplier, risk, training, managementReview, incident },
  };
}
