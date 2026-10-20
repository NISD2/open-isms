import type { FrameworkSeedSpec } from "../seed";
import { euAiActCategories, getEuAiActRequirementsForCategory } from "./eu-ai-act";
import { euCraCategories, getEuCraRequirementsForCategory } from "./eu-cra";
import { gdprCategories, getGdprRequirementsForCategory } from "./gdpr";
import { getIso27001RequirementsForCategory, iso27001Categories } from "./iso27001";
import { getNis2RequirementsForCategory, nis2Categories } from "./nis2";

/** A framework's `compliance_framework` row, its categories and requirements. */
export interface FrameworkData extends FrameworkSeedSpec {
  /** How the package's own documents name it. */
  readonly name: string;
  /** The texts its requirements cite. */
  readonly source: string;
}

/**
 * Every framework this package carries: its `compliance_framework` row (version, effective date,
 * whether it is active), its categories and requirements. The seed script, the migration
 * generator, the seed file and the integrity test all read this list, so a framework and its row
 * are added here once.
 *
 * `isActive` decides what a new signup is provisioned with and what the sidebar shows. NIS 2 and
 * the GDPR are in the offer; ISO 27001, the AI Act and the CRA are seeded so their links resolve
 * and stay out of the product until each has a walk.
 */
export const FRAMEWORK_DATA = [
  {
    code: "nis2",
    name: "NIS2",
    source:
      "Directive (EU) 2022/2555 and Implementing Regulation (EU) 2024/2690, with the German BSIG as transposition",
    version: "2026",
    effectiveDate: "2026-03-17",
    codePrefix: "NIS2-",
    sidebarLabel: "nis2",
    isActive: true,
    categories: nis2Categories,
    getRequirements: getNis2RequirementsForCategory,
  },
  {
    code: "gdpr",
    name: "GDPR",
    source: "Regulation (EU) 2016/679, with the German BDSG where it modifies a duty",
    version: "2016/679",
    effectiveDate: "2018-05-25",
    codePrefix: "DSGVO-",
    sidebarLabel: "dsgvo",
    isActive: true,
    categories: gdprCategories,
    getRequirements: getGdprRequirementsForCategory,
  },
  {
    code: "iso27001",
    name: "ISO/IEC 27001:2022",
    source:
      "Clause and Annex A control numbers of ISO/IEC 27001:2022 with Amendment 1:2024; the standard's text is not reproduced",
    version: "2022",
    effectiveDate: "2022-10-25",
    codePrefix: "ISO27001-",
    sidebarLabel: "iso27001",
    isActive: false,
    categories: iso27001Categories,
    getRequirements: getIso27001RequirementsForCategory,
  },
  {
    code: "eu_ai_act",
    name: "EU AI Act",
    source: "Regulation (EU) 2024/1689",
    version: "2024/1689",
    effectiveDate: "2024-08-01",
    codePrefix: "AI-",
    sidebarLabel: "aiact",
    isActive: false,
    categories: euAiActCategories,
    getRequirements: getEuAiActRequirementsForCategory,
  },
  {
    code: "eu_cra",
    name: "EU Cyber Resilience Act",
    source: "Regulation (EU) 2024/2847",
    version: "2024/2847",
    effectiveDate: "2024-12-10",
    codePrefix: "CRA-",
    sidebarLabel: "cra",
    isActive: false,
    categories: euCraCategories,
    getRequirements: getEuCraRequirementsForCategory,
  },
] as const satisfies readonly FrameworkData[];
