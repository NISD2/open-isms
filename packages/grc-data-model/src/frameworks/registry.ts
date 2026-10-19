import { euAiActCategories, getEuAiActRequirementsForCategory } from "./eu-ai-act";
import { euCraCategories, getEuCraRequirementsForCategory } from "./eu-cra";
import { gdprCategories, getGdprRequirementsForCategory } from "./gdpr";
import { getIso27001RequirementsForCategory, iso27001Categories } from "./iso27001";
import { getNis2RequirementsForCategory, nis2Categories } from "./nis2";
import type { FrameworkCategory, FrameworkRequirement } from "./types";

export interface FrameworkData {
  /** The framework's `compliance_framework.code`. */
  readonly code: string;
  /** How the package's own documents name it. */
  readonly name: string;
  /** The texts its requirements cite. */
  readonly source: string;
  readonly categories: readonly FrameworkCategory[];
  readonly getRequirements: (slug: string) => FrameworkRequirement[];
}

/**
 * Every framework this package carries, with its categories and requirements. The migration
 * generator and the integrity test read this list, so a new framework's data is added here once.
 * Its `compliance_framework` row is not: that row (version, dates, whether it is active) lives in
 * drizzle/seed.ts and, for the seed file, in the generator's FRAMEWORK_ROWS. Category and
 * requirement upserts only land where that row exists.
 */
export const FRAMEWORK_DATA = [
  {
    code: "nis2",
    name: "NIS2",
    source:
      "Directive (EU) 2022/2555 and Implementing Regulation (EU) 2024/2690, with the German BSIG as transposition",
    categories: nis2Categories,
    getRequirements: getNis2RequirementsForCategory,
  },
  {
    code: "gdpr",
    name: "GDPR",
    source: "Regulation (EU) 2016/679, with the German BDSG where it modifies a duty",
    categories: gdprCategories,
    getRequirements: getGdprRequirementsForCategory,
  },
  {
    code: "iso27001",
    name: "ISO/IEC 27001:2022",
    source:
      "Clause and Annex A control numbers of ISO/IEC 27001:2022 with Amendment 1:2024; the standard's text is not reproduced",
    categories: iso27001Categories,
    getRequirements: getIso27001RequirementsForCategory,
  },
  {
    code: "eu_ai_act",
    name: "EU AI Act",
    source: "Regulation (EU) 2024/1689",
    categories: euAiActCategories,
    getRequirements: getEuAiActRequirementsForCategory,
  },
  {
    code: "eu_cra",
    name: "EU Cyber Resilience Act",
    source: "Regulation (EU) 2024/2847",
    categories: euCraCategories,
    getRequirements: getEuCraRequirementsForCategory,
  },
] as const satisfies readonly FrameworkData[];
