/**
 * Values here are seeded into `requirement` / `requirement_category` rows.
 * Editing them changes what a FRESH seed produces; it does not reach a
 * database that is already seeded (production included). After changing
 * anything below, run `bun db:framework-migration` to emit the data
 * migration that carries it forward. `bun db:generate` will not: it diffs
 * the schema, and row content is not schema.
 */
import type { FrameworkCategory, FrameworkRequirement } from "./types";
import { makeRequirementFactory } from "./types";

const mkReq = makeRequirementFactory("cra-req");

export const euCraCategories: FrameworkCategory[] = [
  { id: "cra-cat-01", code: "CRA-MFG", slug: "cra-manufacturer-obligations",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 1, estimatedMinutes: 60, relevantRoles: ["cto", "ciso"] },
  { id: "cra-cat-02", code: "CRA-ESS", slug: "cra-essential-requirements",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 2, estimatedMinutes: 90, relevantRoles: ["cto", "ciso"] },
  { id: "cra-cat-03", code: "CRA-VLN", slug: "cra-vulnerability-handling",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 3, estimatedMinutes: 60, relevantRoles: ["cto", "ciso"] },
  { id: "cra-cat-04", code: "CRA-INC", slug: "cra-incident-reporting",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 4, estimatedMinutes: 45, relevantRoles: ["ciso"] },
  { id: "cra-cat-05", code: "CRA-CONF", slug: "cra-conformity-assessment",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 5, estimatedMinutes: 90, relevantRoles: ["legal", "cto"] },
  { id: "cra-cat-06", code: "CRA-DOC", slug: "cra-technical-documentation",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 6, estimatedMinutes: 90, relevantRoles: ["cto"] },
  { id: "cra-cat-07", code: "CRA-SUP", slug: "cra-support-period",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 7, estimatedMinutes: 30, relevantRoles: ["ceo", "cto"] },
  { id: "cra-cat-08", code: "CRA-SBOM", slug: "cra-sbom",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 8, estimatedMinutes: 45, relevantRoles: ["cto"] },
  { id: "cra-cat-09", code: "CRA-IMP", slug: "cra-importer-distributor",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 9, estimatedMinutes: 45, relevantRoles: ["legal", "cpo"] },
  { id: "cra-cat-10", code: "CRA-OSS", slug: "cra-oss-steward",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", nationalUrl: "",
    sortOrder: 10, estimatedMinutes: 30, relevantRoles: ["cto"] },
];

const REQUIREMENTS_BY_SLUG: Record<string, () => FrameworkRequirement[]> = {
  "cra-manufacturer-obligations": () => [
    mkReq("CRA-MFG.1", "document", { priority: "P0", frequency: "on-change", legalRef: "CRA Art. 13(2)", frameworkRef: "Art. 13", moduleRef: "risk" }),
    mkReq("CRA-MFG.2", "sign-off", { priority: "P0", frequency: "on-change", legalRef: "CRA Art. 13(1)", frameworkRef: "Art. 13", requiredSignOffRole: "ceo" }),
  ],
  "cra-essential-requirements": () => [
    mkReq("CRA-ESS.1", "technical", { priority: "P0", frequency: "ongoing", legalRef: "CRA Annex I Part I", frameworkRef: "Annex I" }),
    mkReq("CRA-ESS.2", "technical", { priority: "P0", frequency: "ongoing", legalRef: "CRA Annex I Part I §3(a)", frameworkRef: "Annex I" }),
    mkReq("CRA-ESS.3", "proof", { priority: "P0", frequency: "on-change", legalRef: "CRA Annex I Part I §1", frameworkRef: "Annex I" }),
  ],
  "cra-vulnerability-handling": () => [
    mkReq("CRA-VLN.1", "document", { priority: "P0", frequency: "one-time", legalRef: "CRA Annex I Part II §1-2", frameworkRef: "Annex I", moduleRef: "policy" }),
    mkReq("CRA-VLN.2", "document", { priority: "P0", frequency: "one-time", legalRef: "CRA Annex I Part II §5", frameworkRef: "Annex I", moduleRef: "policy" }),
    mkReq("CRA-VLN.3", "technical", { priority: "P0", frequency: "ongoing", legalRef: "CRA Annex I Part II §3", frameworkRef: "Annex I", moduleRef: "patch_record" }),
    mkReq("CRA-VLN.4", "proof", { priority: "P1", frequency: "on-change", legalRef: "CRA Annex I Part II §8", frameworkRef: "Annex I" }),
  ],
  "cra-incident-reporting": () => [
    mkReq("CRA-INC.1", "proof", { priority: "P0", frequency: "on-change", legalRef: "CRA Art. 14(2)(a)", frameworkRef: "Art. 14", moduleRef: "incident" }),
    mkReq("CRA-INC.2", "proof", { priority: "P0", frequency: "on-change", legalRef: "CRA Art. 14(2)(b)", frameworkRef: "Art. 14", moduleRef: "incident" }),
    mkReq("CRA-INC.3", "proof", { priority: "P0", frequency: "on-change", legalRef: "CRA Art. 14(2)(c)", frameworkRef: "Art. 14", moduleRef: "incident" }),
    mkReq("CRA-INC.4", "proof", { priority: "P0", frequency: "on-change", legalRef: "CRA Art. 14(4)", frameworkRef: "Art. 14", moduleRef: "incident" }),
  ],
  "cra-conformity-assessment": () => [
    mkReq("CRA-CONF.1", "document", { priority: "P0", frequency: "on-change", legalRef: "CRA Art. 24", frameworkRef: "Art. 24" }),
    mkReq("CRA-CONF.2", "proof", { priority: "P0", frequency: "on-change", legalRef: "CRA Art. 27", frameworkRef: "Art. 27" }),
  ],
  "cra-technical-documentation": () => [
    mkReq("CRA-DOC.1", "document", { priority: "P0", frequency: "on-change", legalRef: "CRA Annex VII, Art. 28", frameworkRef: "Annex VII" }),
  ],
  "cra-support-period": () => [
    mkReq("CRA-SUP.1", "sign-off", { priority: "P0", frequency: "one-time", legalRef: "CRA Art. 13(8)", frameworkRef: "Art. 13", requiredSignOffRole: "ceo" }),
  ],
  "cra-sbom": () => [
    mkReq("CRA-SBOM.1", "document", { priority: "P1", frequency: "on-change", legalRef: "CRA Annex I Part II §1", frameworkRef: "Annex I" }),
  ],
  "cra-importer-distributor": () => [
    mkReq("CRA-IMP.1", "proof", { priority: "P1", frequency: "on-change", legalRef: "CRA Art. 18", frameworkRef: "Art. 18", moduleRef: "supplier" }),
    mkReq("CRA-IMP.2", "proof", { priority: "P1", frequency: "on-change", legalRef: "CRA Art. 19", frameworkRef: "Art. 19", moduleRef: "supplier" }),
  ],
  "cra-oss-steward": () => [
    mkReq("CRA-OSS.1", "document", { priority: "P1", frequency: "one-time", legalRef: "CRA Art. 24", frameworkRef: "Art. 24", moduleRef: "policy" }),
  ],
};

export function getEuCraRequirementsForCategory(slug: string): FrameworkRequirement[] {
  const builder = REQUIREMENTS_BY_SLUG[slug];
  if (!builder) return [];
  return builder();
}
