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

const mkReq = makeRequirementFactory("aiact-req");

export const euAiActCategories: FrameworkCategory[] = [
  { id: "aiact-cat-01", code: "AI-LIT", slug: "aiact-literacy",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 1, estimatedMinutes: 45, relevantRoles: ["ceo", "ciso", "hr_director"] },
  { id: "aiact-cat-02", code: "AI-PRO", slug: "aiact-prohibited",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 2, estimatedMinutes: 30, relevantRoles: ["legal", "ciso"] },
  { id: "aiact-cat-03", code: "AI-INV", slug: "aiact-inventory",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 3, estimatedMinutes: 60, relevantRoles: ["ciso", "cto"] },
  { id: "aiact-cat-04", code: "AI-RSK", slug: "aiact-risk-management",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 4, estimatedMinutes: 60, relevantRoles: ["ciso"] },
  { id: "aiact-cat-05", code: "AI-FRI", slug: "aiact-fundamental-rights",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 5, estimatedMinutes: 90, relevantRoles: ["legal", "ciso"] },
  { id: "aiact-cat-06", code: "AI-OVS", slug: "aiact-human-oversight",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 6, estimatedMinutes: 45, relevantRoles: ["ciso"] },
  { id: "aiact-cat-07", code: "AI-TRA", slug: "aiact-transparency",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 7, estimatedMinutes: 45, relevantRoles: ["legal", "cto"] },
  { id: "aiact-cat-08", code: "AI-INC", slug: "aiact-incident-reporting",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 8, estimatedMinutes: 40, relevantRoles: ["ciso"] },
  { id: "aiact-cat-09", code: "AI-DOC", slug: "aiact-technical-documentation",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 9, estimatedMinutes: 90, relevantRoles: ["cto", "ciso"] },
  { id: "aiact-cat-10", code: "AI-GPI", slug: "aiact-gpai",
    referenceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", nationalUrl: "",
    sortOrder: 10, estimatedMinutes: 60, relevantRoles: ["cto"] },
];

const REQUIREMENTS_BY_SLUG: Record<string, () => FrameworkRequirement[]> = {
  "aiact-literacy": () => [
    mkReq("AI-LIT.1", "training", { priority: "P1", frequency: "annual", legalRef: "AI Act Art. 4", frameworkRef: "Art. 4", moduleRef: "training_record" }),
    mkReq("AI-LIT.2", "training", { priority: "P1", frequency: "every-3-years", legalRef: "AI Act Art. 4, Art. 26(2)", frameworkRef: "Art. 4", moduleRef: "training_record", requiredSignOffRole: "ceo" }),
  ],
  "aiact-prohibited": () => [
    mkReq("AI-PRO.1", "document", { priority: "P0", frequency: "on-change", legalRef: "AI Act Art. 5(1)(a)-(i)", frameworkRef: "Art. 5", moduleRef: "policy" }),
    mkReq("AI-PRO.2", "proof", { priority: "P0", frequency: "on-change", legalRef: "AI Act Art. 5", frameworkRef: "Art. 5" }),
  ],
  "aiact-inventory": () => [
    mkReq("AI-INV.1", "document", { priority: "P0", frequency: "ongoing", legalRef: "AI Act Art. 6, Art. 26", frameworkRef: "Art. 6", moduleRef: "asset" }),
    mkReq("AI-INV.2", "proof", { priority: "P0", frequency: "on-change", legalRef: "AI Act Art. 6, Art. 50", frameworkRef: "Art. 6", moduleRef: "asset" }),
    mkReq("AI-INV.3", "proof", { priority: "P1", frequency: "on-change", legalRef: "AI Act Art. 25", frameworkRef: "Art. 25" }),
  ],
  "aiact-risk-management": () => [
    mkReq("AI-RSK.1", "document", { priority: "P0", frequency: "one-time", legalRef: "AI Act Art. 9", frameworkRef: "Art. 9", moduleRef: "policy" }),
    mkReq("AI-RSK.2", "proof", { priority: "P1", frequency: "annual", legalRef: "AI Act Art. 9", frameworkRef: "Art. 9", moduleRef: "risk" }),
  ],
  "aiact-fundamental-rights": () => [
    mkReq("AI-FRI.1", "document", { priority: "P0", frequency: "on-change", legalRef: "AI Act Art. 27", frameworkRef: "Art. 27", moduleRef: "policy", requiredSignOffRole: "ceo" }),
  ],
  "aiact-human-oversight": () => [
    mkReq("AI-OVS.1", "proof", { priority: "P0", frequency: "on-change", legalRef: "AI Act Art. 14, Art. 26(2)", frameworkRef: "Art. 14" }),
    mkReq("AI-OVS.2", "proof", { priority: "P1", frequency: "annual", legalRef: "AI Act Art. 14", frameworkRef: "Art. 14" }),
  ],
  "aiact-transparency": () => [
    mkReq("AI-TRA.1", "document", { priority: "P1", frequency: "on-change", legalRef: "AI Act Art. 50(1)", frameworkRef: "Art. 50" }),
    mkReq("AI-TRA.2", "technical", { priority: "P1", frequency: "ongoing", legalRef: "AI Act Art. 50(2)", frameworkRef: "Art. 50" }),
    mkReq("AI-TRA.3", "proof", { priority: "P1", frequency: "on-change", legalRef: "AI Act Art. 50(4)", frameworkRef: "Art. 50" }),
  ],
  "aiact-incident-reporting": () => [
    mkReq("AI-INC.1", "document", { priority: "P0", frequency: "one-time", legalRef: "AI Act Art. 73", frameworkRef: "Art. 73", moduleRef: "policy" }),
    mkReq("AI-INC.2", "proof", { priority: "P0", frequency: "on-change", legalRef: "AI Act Art. 73", frameworkRef: "Art. 73", moduleRef: "incident" }),
  ],
  "aiact-technical-documentation": () => [
    mkReq("AI-DOC.1", "document", { priority: "P1", frequency: "on-change", legalRef: "AI Act Annex IV, Art. 11, Art. 18", frameworkRef: "Annex IV" }),
    mkReq("AI-DOC.2", "technical", { priority: "P1", frequency: "ongoing", legalRef: "AI Act Art. 12, Art. 19", frameworkRef: "Art. 12" }),
    mkReq("AI-DOC.3", "sign-off", { priority: "P0", frequency: "on-change", legalRef: "AI Act Art. 47, Annex V", frameworkRef: "Art. 47", requiredSignOffRole: "ceo" }),
  ],
  "aiact-gpai": () => [
    mkReq("AI-GPI.1", "document", { priority: "P1", frequency: "on-change", legalRef: "AI Act Art. 53(1)(a)", frameworkRef: "Art. 53" }),
    mkReq("AI-GPI.2", "document", { priority: "P1", frequency: "one-time", legalRef: "AI Act Art. 53(1)(c)", frameworkRef: "Art. 53" }),
    mkReq("AI-GPI.3", "document", { priority: "P1", frequency: "on-change", legalRef: "AI Act Art. 53(1)(d)", frameworkRef: "Art. 53" }),
    mkReq("AI-GPI.4", "proof", { priority: "P0", frequency: "ongoing", legalRef: "AI Act Art. 55", frameworkRef: "Art. 55" }),
  ],
};

export function getEuAiActRequirementsForCategory(slug: string): FrameworkRequirement[] {
  const builder = REQUIREMENTS_BY_SLUG[slug];
  if (!builder) return [];
  return builder();
}
