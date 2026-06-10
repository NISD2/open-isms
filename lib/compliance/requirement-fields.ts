/**
 * Inverted field mapping — requirement code → intake fields.
 *
 * The primary mapping (CATEGORY_FIELD_MAPPING) goes field → requirement codes.
 * This module inverts it: given a requirement code, return the intake field keys
 * and a Zod sub-schema containing only those fields.
 *
 * Used by the per-requirement detail page to render focused forms.
 */
import { z } from "zod";
import { CATEGORY_FIELD_MAPPING, CATEGORY_SCHEMAS } from "./category-schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RequirementFieldInfo {
  categoryCode: string;
  fieldKeys: string[];
}

// ---------------------------------------------------------------------------
// Precomputed inverted mapping (built once at module load)
// ---------------------------------------------------------------------------

/** reqCode → { categoryCode, fieldKeys[] } */
export const REQUIREMENT_FIELD_MAP: Record<string, RequirementFieldInfo> =
  buildInvertedMap();

function buildInvertedMap(): Record<string, RequirementFieldInfo> {
  const result: Record<string, RequirementFieldInfo> = {};

  for (const [categoryCode, fieldMap] of Object.entries(
    CATEGORY_FIELD_MAPPING
  )) {
    for (const [fieldKey, reqCodes] of Object.entries(fieldMap)) {
      for (const reqCode of reqCodes) {
        if (!result[reqCode]) {
          result[reqCode] = { categoryCode, fieldKeys: [] };
        }
        if (!result[reqCode].fieldKeys.includes(fieldKey)) {
          result[reqCode].fieldKeys.push(fieldKey);
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Custom editor field definitions (for guidance generation only)
// ---------------------------------------------------------------------------

/** Field metadata for requirements with custom editors (not schema-form). */
export const CUSTOM_EDITOR_FIELDS: Record<string, Array<{
  key: string;
  label: string;
  type: string;
  required: boolean;
}>> = {
  "2.1": [
    { key: "methodologyName", label: "Risk Methodology Name", type: "text", required: true },
    { key: "likelihoodScale", label: "Likelihood Scale (levels with labels and descriptions)", type: "scale_table", required: true },
    { key: "impactScale", label: "Impact Scale (levels with labels and descriptions)", type: "scale_table", required: true },
    { key: "acceptanceThreshold", label: "Risk Acceptance Threshold (max score to accept without treatment)", type: "number", required: true },
    { key: "otIcsCoverage", label: "OT/ICS Coverage (methodology covers operational technology)", type: "checkbox", required: false },
  ],
  "9.1": [
    { key: "algorithms", label: "Approved & Prohibited Algorithms (table of cryptographic algorithms with status)", type: "algorithm_table", required: true },
    { key: "minTlsVersion", label: "Minimum TLS Version", type: "select", required: true },
    { key: "keyRotation", label: "Key Rotation Frequency (years)", type: "number", required: true },
    { key: "postQuantumReadiness", label: "Post-Quantum Readiness", type: "checkbox", required: false },
  ],
  "10.1": [
    { key: "accessModel", label: "Access Control Model (RBAC, ABAC, or hybrid)", type: "select", required: true },
    { key: "reviewFrequency", label: "Access Review Frequency (standard and privileged accounts)", type: "text_pair", required: true },
    { key: "deprovisioningSla", label: "De-provisioning SLA (hours to revoke access after termination)", type: "number", required: true },
    { key: "sharedAccountPolicy", label: "Shared/generic account policy (prohibited or documented exceptions)", type: "select", required: true },
    { key: "authReviewCycle", label: "Authentication methods review cycle (years)", type: "number", required: true },
  ],
  "6.1": [
    { key: "threshold", label: "Procurement Security Threshold (EUR amount above which security review is required)", type: "number", required: true },
    { key: "requiredClauses", label: "Required Contract Clauses (8 mandatory cybersecurity clauses per CIR Art. 5)", type: "checkbox_group", required: true },
    { key: "evaluationCriteria", label: "Vendor Evaluation Criteria (weighted scoring criteria for supplier assessment)", type: "criteria_table", required: true },
    { key: "reviewFrequency", label: "Policy Review Frequency", type: "text", required: true },
  ],
  "6.2": [
    { key: "sdlcFramework", label: "Secure Development Lifecycle Framework", type: "select", required: true },
    { key: "hardeningBaseline", label: "System Hardening Baseline", type: "select", required: true },
    { key: "testingRequirements", label: "Security Testing Requirements (SAST, DAST, SCA, pentest, code review)", type: "checkbox_group", required: true },
    { key: "environmentSegregation", label: "Environment Segregation (dev/test/prod separation)", type: "checkbox", required: true },
  ],
  "6.4": [
    { key: "patchSlaHours", label: "Patch SLA by Severity (hours per severity level)", type: "sla_table", required: true },
    { key: "reviewCycleYears", label: "Review Cycle (years)", type: "number", required: true },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the intake field keys and Zod sub-schema for a given requirement.
 * Returns null if no intake fields map to this requirement
 * (sign-off-only or module-backed requirements).
 */
export function getFieldsForRequirement(
  reqCode: string
): { fieldKeys: string[]; schema: z.ZodObject<z.ZodRawShape> } | null {
  const info = REQUIREMENT_FIELD_MAP[reqCode];
  if (!info) return null;

  const fullSchema = CATEGORY_SCHEMAS[info.categoryCode];
  if (!fullSchema) return null;

  const shape = fullSchema.shape as Record<string, z.ZodTypeAny>;
  const subShape: Record<string, z.ZodTypeAny> = {};

  for (const key of info.fieldKeys) {
    if (shape[key]) {
      // Make all fields optional in per-requirement context so partial saves work
      const field = shape[key];
      const defType = (field as unknown as { _def: { type: string } })._def
        ?.type;
      const isAlreadyOptional =
        defType === "optional" || defType === "nullable" || defType === "default";
      subShape[key] = isAlreadyOptional ? field : field.optional();
    }
  }

  if (Object.keys(subShape).length === 0) return null;

  return {
    fieldKeys: info.fieldKeys,
    schema: z.object(subShape) as z.ZodObject<z.ZodRawShape>,
  };
}
