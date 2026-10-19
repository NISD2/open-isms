import { euAiActCategories, getEuAiActRequirementsForCategory } from "./eu-ai-act";
import { euCraCategories, getEuCraRequirementsForCategory } from "./eu-cra";
import { gdprCategories, getGdprRequirementsForCategory } from "./gdpr";
import { getIso27001RequirementsForCategory, iso27001Categories } from "./iso27001";
import { getNis2RequirementsForCategory, nis2Categories } from "./nis2";
import type { FrameworkCategory, FrameworkRequirement } from "./types";

export interface FrameworkData {
  /** The framework's `compliance_framework.code`. */
  readonly code: string;
  readonly categories: readonly FrameworkCategory[];
  readonly getRequirements: (slug: string) => FrameworkRequirement[];
}

/**
 * Every framework this package carries. Whatever walks all framework data reads this list (the
 * migration generator, the integrity test), so a new framework is added here and nowhere else.
 */
export const FRAMEWORK_DATA = [
  {
    code: "nis2",
    categories: nis2Categories,
    getRequirements: getNis2RequirementsForCategory,
  },
  {
    code: "gdpr",
    categories: gdprCategories,
    getRequirements: getGdprRequirementsForCategory,
  },
  {
    code: "iso27001",
    categories: iso27001Categories,
    getRequirements: getIso27001RequirementsForCategory,
  },
  {
    code: "eu_ai_act",
    categories: euAiActCategories,
    getRequirements: getEuAiActRequirementsForCategory,
  },
  {
    code: "eu_cra",
    categories: euCraCategories,
    getRequirements: getEuCraRequirementsForCategory,
  },
] as const satisfies readonly FrameworkData[];
