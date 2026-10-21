import "@/lib/server-guard";

import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";
import { z } from "zod";
import { DURCHGANG_MESSAGES } from "@/i18n/durchgang";
import { WALK_LOCALES } from "@/lib/durchgang/types";
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
  vulnerability: ["vulnerabilities", ["vulnerabilities", "fields"]],
  patch: ["patches", ["patches", "fields"]],
  change: ["changes", ["changes", "fields"]],
  exercise: ["exercises", ["exercises", "fields"]],
  improvement: ["improvements", ["improvements", "fields"]],
  internalAudit: ["internal-audits", ["internalAudits", "fields"]],
  kpi: ["kpis", ["kpis", "fields"]],
} as const satisfies Record<
  Exclude<ExportRecord, "company">,
  readonly [string, readonly string[]]
>;

/**
 * Coded values one register names its own way: a status means something else in each, so these
 * are looked up by register first (`RegisterValues`), before the shared `VALUE_SOURCES`.
 */
const REGISTER_VALUE_SOURCES = {
  vulnerability: {
    severity: ["vulnerabilities", ["vulnerabilities", "severity"]],
    status: ["vulnerabilities", ["vulnerabilities", "status"]],
    source: ["vulnerabilities", ["vulnerabilities", "source"]],
  },
  patch: {
    severity: ["patches", ["patches", "severity"]],
    status: ["patches", ["patches", "status"]],
  },
  change: {
    changeType: ["changes", ["changes", "changeType"]],
    status: ["changes", ["changes", "status"]],
  },
  exercise: { exerciseType: ["exercises", ["exercises", "exerciseType"]] },
  improvement: {
    source: ["improvements", ["improvements", "source"]],
    priority: ["improvements", ["improvements", "priority"]],
    status: ["improvements", ["improvements", "status"]],
  },
  internalAudit: { status: ["internal-audits", ["internalAudits", "status"]] },
  kpi: { status: ["kpis", ["kpis", "status"]] },
} as const satisfies Partial<
  Record<
    Exclude<ExportRecord, "company">,
    Readonly<Record<string, readonly [string, readonly string[]]>>
  >
>;

export type CodedField = keyof typeof VALUE_SOURCES;
export type Register = keyof typeof FIELD_SOURCES;
type Names = Readonly<Record<string, string>>;
/** A register's own names for its coded values, by field. */
export type RegisterValues = Readonly<
  Partial<Record<Register, Readonly<Record<string, Names>>>>
>;

/** What the export calls the answers typed in each category. */
export interface AnswerNames {
  /** Each answer's label, by category code, then field key: a key can mean two things in two areas. */
  readonly labels: Readonly<Record<string, Names>>;
  /** The name of each choice an answer can hold, by field key. */
  readonly values: Readonly<Record<string, Names>>;
}

export interface ExportNames {
  /** The name of each coded value, by field. */
  readonly values: Readonly<Record<CodedField, Names>>;
  /** Each register's field labels, by field. */
  readonly fields: Readonly<Record<Register, Names>>;
  /** The coded values a register names its own way, before `values`. */
  readonly registerValues: RegisterValues;
  readonly answers: AnswerNames;
  /**
   * The title the walk gives a management training, in the export's language,
   * and as it is stored in every language the walk is written in: the walk saves it in the
   * language of whoever entered the row.
   */
  readonly managementTraining: {
    readonly name: string;
    readonly stored: readonly string[];
  };
}

/** The walk's title for a management training row, in `locale`. */
const managementTrainingTitle = async (locale: PdfLocale): Promise<string> => {
  const walk: unknown = DURCHGANG_MESSAGES[locale];
  const title = at(walk, ["durchgang", "ui", "training", "managementTraining"]);
  return typeof title === "string" ? title : "";
};

/** Message files are data: a map that does not parse names nothing, and the key prints. */
const NAMES = z.record(z.string(), z.string()).catch({});
const SECTIONS = z.record(z.string(), z.unknown()).catch({});

/** The value under `path` in a message file's JSON, or undefined. */
const at = (json: unknown, path: readonly string[]): unknown =>
  path.reduce<unknown>(
    (node, key) =>
      typeof node === "object" && node !== null
        ? new Map(Object.entries(node)).get(key)
        : undefined,
    json,
  );

/** Each NIS 2 requirement's category code, by requirement code ("6.1" is PRO). */
const CATEGORY_OF: ReadonlyMap<string, string> = new Map(
  nis2Categories.flatMap((category) =>
    getNis2RequirementsForCategory(category.slug).map((r): [string, string] => [
      r.code,
      category.code,
    ]),
  ),
);

/**
 * Each field label under `sections`, which are keyed by requirement (`codeOf` reads the code off
 * a section's key) and hold their fields as `fields.<key>.label`, with the field's category.
 */
const fieldLabelsIn = (
  sections: unknown,
  codeOf: (section: string) => string,
): [string, string, string][] =>
  Object.entries(SECTIONS.parse(sections)).flatMap(([section, body]) => {
    const category = CATEGORY_OF.get(codeOf(section));
    if (!category) return [];
    return Object.entries(SECTIONS.parse(at(body, ["fields"]))).flatMap(
      ([key, field]): [string, string, string][] => {
        const label = at(field, ["label"]);
        return typeof label === "string" ? [[category, key, label]] : [];
      },
    );
  });

/**
 * The answers' labels, the walk's own wording where the walk asks a field, else the requirement
 * page's guidance; and the names of the choices an answer can hold.
 */
async function answerNames(locale: PdfLocale): Promise<AnswerNames> {
  const [walk, guidance, compliance]: unknown[] = await Promise.all([
    DURCHGANG_MESSAGES[locale],
    import(`../../data/guidance/${locale}.json`).then((m) => m.default),
    import(`../../messages/compliance/${locale}.json`).then((m) => m.default),
  ]);
  const labels = [
    ...fieldLabelsIn(guidance, (code) => code),
    // The walk keys its items "6_1".
    ...fieldLabelsIn(at(walk, ["durchgang", "items"]), (key) => key.split("_").join(".")),
  ].reduce<Record<string, Record<string, string>>>(
    (byCategory, [category, key, label]) => ({
      ...byCategory,
      [category]: { ...byCategory[category], [key]: label },
    }),
    {},
  );
  const values = Object.fromEntries(
    Object.entries(SECTIONS.parse(at(compliance, ["intake", "answerOptions"]))).map(
      ([field, names]) => [field, NAMES.parse(names)],
    ),
  );
  return { labels, values };
}

type Source = readonly [string, readonly string[]];

/** Each register's own value names (`REGISTER_VALUE_SOURCES`), read with `named`. */
const registerValuesIn = async (
  named: (source: Source) => Promise<Names>,
): Promise<RegisterValues> =>
  Object.fromEntries(
    await Promise.all(
      Object.entries(REGISTER_VALUE_SOURCES).map(async ([register, fields]) => [
        register,
        Object.fromEntries(
          await Promise.all(
            Object.entries(fields).map(async ([field, source]) => [
              field,
              await named(source),
            ]),
          ),
        ),
      ]),
    ),
  );

/**
 * What the export calls fields and coded values, in `locale`, read the way `lib/messages`
 * reads its files, so it works on a route and in a script alike.
 */
export async function exportNames(locale: PdfLocale): Promise<ExportNames> {
  const named = async ([file, path]: readonly [string, readonly string[]]) => {
    // The walk's copy is stored in parts (i18n/durchgang.ts), not one file per language.
    const json: unknown =
      file === "durchgang"
        ? DURCHGANG_MESSAGES[locale]
        : (await import(`../../messages/${file}/${locale}.json`)).default;
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
    vulnerability,
    patch,
    change,
    exercise,
    improvement,
    internalAudit,
    kpi,
    registerValues,
    answers,
    managementTraining,
    storedManagementTraining,
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
    named(FIELD_SOURCES.vulnerability),
    named(FIELD_SOURCES.patch),
    named(FIELD_SOURCES.change),
    named(FIELD_SOURCES.exercise),
    named(FIELD_SOURCES.improvement),
    named(FIELD_SOURCES.internalAudit),
    named(FIELD_SOURCES.kpi),
    registerValuesIn(named),
    answerNames(locale),
    managementTrainingTitle(locale),
    Promise.all(WALK_LOCALES.map(managementTrainingTitle)),
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
    fields: {
      asset,
      supplier,
      risk,
      training,
      managementReview,
      incident,
      vulnerability,
      patch,
      change,
      exercise,
      improvement,
      internalAudit,
      kpi,
    },
    registerValues,
    answers,
    managementTraining: {
      name: managementTraining,
      stored: storedManagementTraining.filter((title) => title !== ""),
    },
  };
}
