/**
 * Load category intake data for policy PDF export.
 *
 * Takes an assessmentId + categoryCode, loads the intake answers,
 * field labels via schema introspection, sign-off data, and groups
 * fields by requirement code using CATEGORY_FIELD_MAPPING.
 */
import { and, asc, eq } from "drizzle-orm";
import {
  CATEGORY_FIELD_MAPPING,
  CATEGORY_SCHEMAS,
} from "@/lib/compliance/category-schemas";
import { db } from "@/lib/db";
import { humanize, introspectSchema } from "@/lib/forms/schema-introspect";
import {
  getCategoryName,
  getComplianceMessages,
  getRequirementsMessages,
  getRequirementTitle,
  type RequirementsMessages,
} from "@/lib/messages";
import {
  companyAssessment,
  companyCategoryIntake,
  requirement,
  requirementCategory,
} from "@/schema";
import { getDocumentLabels } from "./policy-labels";

export interface PolicyFieldValue {
  key: string;
  label: string;
  value: unknown;
  type: string;
}

export interface PolicyRequirementGroup {
  code: string;
  title: string;
  legalRef: string | null;
  fields: PolicyFieldValue[];
}

export interface PolicyData {
  companyName: string;
  categoryCode: string;
  categoryName: string;
  frameworkName: string;
  signedOffBy: string | null;
  signedOffAt: Date | null;
  groups: PolicyRequirementGroup[];
}

export async function loadPolicyData(
  assessmentId: string,
  categoryCode: string,
  locale = "en",
): Promise<PolicyData> {
  const [compliance, requirementMessages, assessment] = await Promise.all([
    getComplianceMessages(locale),
    getRequirementsMessages(locale),
    db.query.companyAssessment.findFirst({
      where: eq(companyAssessment.id, assessmentId),
      with: {
        company: { columns: { name: true } },
        framework: { columns: { id: true } },
      },
    }),
  ]);

  if (!assessment) throw new Error("Assessment not found");

  const category = await db.query.requirementCategory.findFirst({
    where: and(
      eq(requirementCategory.frameworkId, assessment.framework.id),
      eq(requirementCategory.code, categoryCode),
    ),
  });

  if (!category) throw new Error(`Category ${categoryCode} not found`);

  const [intake, requirements] = await Promise.all([
    db.query.companyCategoryIntake.findFirst({
      where: and(
        eq(companyCategoryIntake.assessmentId, assessmentId),
        eq(companyCategoryIntake.categoryId, category.id),
      ),
      with: {
        signedOffByUser: { columns: { name: true } },
      },
    }),
    db.query.requirement.findMany({
      where: eq(requirement.categoryId, category.id),
      orderBy: asc(requirement.sortOrder),
      columns: { code: true, legalRef: true },
    }),
  ]);

  const answers = (intake?.answers ?? {}) as Record<string, unknown>;
  const schema = CATEGORY_SCHEMAS[categoryCode];
  const fieldMapping = CATEGORY_FIELD_MAPPING[categoryCode] ?? {};

  const fieldMetas = schema ? introspectSchema(schema, []) : [];
  const metaByKey = new Map(fieldMetas.map((m) => [m.key, m]));

  const groups = buildFieldGroups(
    requirements,
    fieldMapping,
    answers,
    metaByKey,
    requirementMessages,
    getDocumentLabels(locale).general,
  );

  return {
    companyName: assessment.company.name,
    categoryCode,
    categoryName: getCategoryName(compliance, categoryCode),
    frameworkName: compliance.compliance.frameworkName,
    signedOffBy: intake?.signedOffByUser?.name ?? null,
    signedOffAt: intake?.signedOffAt ?? null,
    groups,
  };
}

function buildFieldGroups(
  requirements: { code: string; legalRef: string | null }[],
  fieldMapping: Record<string, string[]>,
  answers: Record<string, unknown>,
  metaByKey: Map<string, { key: string; label: string; type: string }>,
  requirementMessages: RequirementsMessages,
  generalLabel: string,
): PolicyRequirementGroup[] {
  // Invert mapping: requirement code → field keys
  const reqFieldKeys = new Map<string, string[]>();
  for (const [fieldKey, reqCodes] of Object.entries(fieldMapping)) {
    for (const reqCode of reqCodes) {
      const existing = reqFieldKeys.get(reqCode) ?? [];
      if (!existing.includes(fieldKey)) existing.push(fieldKey);
      reqFieldKeys.set(reqCode, existing);
    }
  }

  const usedFields = new Set<string>();

  const groups: PolicyRequirementGroup[] = requirements
    .map((req) => {
      const keys = reqFieldKeys.get(req.code) ?? [];
      const fields = resolveFields(keys, answers, metaByKey, usedFields);
      return {
        code: req.code,
        title: getRequirementTitle(requirementMessages, req.code),
        legalRef: req.legalRef,
        fields,
      };
    })
    .filter((g) => g.fields.length > 0);

  // Append ungrouped fields not mapped to any requirement
  const ungroupedFields = resolveFields(
    Object.keys(answers).filter((k) => !usedFields.has(k)),
    answers,
    metaByKey,
    usedFields,
  );

  if (ungroupedFields.length > 0) {
    groups.push({
      code: "GENERAL",
      title: generalLabel,
      legalRef: null,
      fields: ungroupedFields,
    });
  }

  return groups;
}

function resolveFields(
  keys: string[],
  answers: Record<string, unknown>,
  metaByKey: Map<string, { key: string; label: string; type: string }>,
  usedFields: Set<string>,
): PolicyFieldValue[] {
  return keys
    .filter((key) => {
      const val = answers[key];
      return val !== undefined && val !== null && val !== "";
    })
    .map((key) => {
      usedFields.add(key);
      const meta = metaByKey.get(key);
      return {
        key,
        label: meta?.label ?? humanize(key),
        value: answers[key],
        type: meta?.type ?? "text",
      };
    });
}
