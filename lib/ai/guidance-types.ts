/**
 * Pre-generated AI guidance for compliance requirement forms.
 *
 * Shape matches the static JSON files at data/guidance/{en,de}.json.
 * Used by the generation script, server page, and RequirementDetail component.
 */

export interface FieldGuidance {
  label: string;
  meaning: string;
  example: string;
  whereToFind: string;
}

export interface RequirementGuidanceData {
  summary: string;
  applicability: string;
  quickTip: string;
  implementationSteps: string;
  evidenceExample: string;
  fields: Record<string, FieldGuidance>;
}

export type GuidanceFile = Record<string, RequirementGuidanceData>;
