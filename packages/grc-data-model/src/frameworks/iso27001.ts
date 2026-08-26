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

const mkReq = makeRequirementFactory("iso27001-req");

const ISO_URL = "https://www.iso.org/standard/27001";

export const iso27001Categories: FrameworkCategory[] = [
  {
    id: "iso27001-cat-01", code: "ISMS", slug: "isms-clauses",
    referenceUrl: ISO_URL, nationalUrl: "",
    sortOrder: 1, estimatedMinutes: 60,
    relevantRoles: ["ciso", "ceo"],
  },
  {
    id: "iso27001-cat-02", code: "ORG", slug: "organizational-controls",
    referenceUrl: ISO_URL, nationalUrl: "",
    sortOrder: 2, estimatedMinutes: 120,
    relevantRoles: ["ciso", "legal"],
  },
  {
    id: "iso27001-cat-03", code: "PPL", slug: "people-controls",
    referenceUrl: ISO_URL, nationalUrl: "",
    sortOrder: 3, estimatedMinutes: 45,
    relevantRoles: ["ciso", "hr_director"],
  },
  {
    id: "iso27001-cat-04", code: "PHY", slug: "physical-controls",
    referenceUrl: ISO_URL, nationalUrl: "",
    sortOrder: 4, estimatedMinutes: 45,
    relevantRoles: ["ciso", "coo"],
  },
  {
    id: "iso27001-cat-05", code: "TEC", slug: "technological-controls",
    referenceUrl: ISO_URL, nationalUrl: "",
    sortOrder: 5, estimatedMinutes: 120,
    relevantRoles: ["ciso", "cto"],
  },
];

const REQUIREMENTS_BY_SLUG: Record<string, () => FrameworkRequirement[]> = {

  // ── Mandatory ISMS clauses (Clauses 4–10) ───────────────────────────────────
  "isms-clauses": () => [
    // Clause 4: Context
    mkReq("IS-4.1", "document", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 4.1", frameworkRef: "4.1" }),
    mkReq("IS-4.2", "document", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 4.2", frameworkRef: "4.2" }),
    mkReq("IS-4.3", "document", { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 Cl. 4.3", frameworkRef: "4.3" }),
    mkReq("IS-4.4", "document", { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 Cl. 4.4", frameworkRef: "4.4" }),
    // Clause 5: Leadership
    mkReq("IS-5.1", "sign-off", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 5.1", frameworkRef: "5.1", requiredSignOffRole: "ceo" }),
    mkReq("IS-5.2", "document", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 5.2", frameworkRef: "5.2", moduleRef: "policy", requiredSignOffRole: "ceo" }),
    mkReq("IS-5.3", "document", { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 Cl. 5.3", frameworkRef: "5.3" }),
    // Clause 6: Planning
    mkReq("IS-6.1", "document", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 6.1", frameworkRef: "6.1" }),
    mkReq("IS-6.2", "document", { priority: "P1", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 6.2", frameworkRef: "6.2" }),
    mkReq("IS-6.3", "document", { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 Cl. 6.3", frameworkRef: "6.3" }),
    // Clause 7: Support
    mkReq("IS-7.1", "document", { priority: "P1", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 7.1", frameworkRef: "7.1" }),
    mkReq("IS-7.2", "training", { priority: "P1", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 7.2", frameworkRef: "7.2", moduleRef: "training_record" }),
    mkReq("IS-7.3", "training", { priority: "P1", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 7.3", frameworkRef: "7.3", moduleRef: "training_record" }),
    mkReq("IS-7.4", "document", { priority: "P2", frequency: "on-change", legalRef: "ISO 27001:2022 Cl. 7.4", frameworkRef: "7.4" }),
    mkReq("IS-7.5", "document", { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 Cl. 7.5", frameworkRef: "7.5" }),
    // Clause 8: Operation
    mkReq("IS-8.1", "document", { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 Cl. 8.1", frameworkRef: "8.1" }),
    mkReq("IS-8.2", "document", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 8.2", frameworkRef: "8.2" }),
    mkReq("IS-8.3", "document", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 8.3", frameworkRef: "8.3" }),
    // Clause 9: Performance evaluation
    mkReq("IS-9.1", "proof", { priority: "P1", frequency: "monthly", legalRef: "ISO 27001:2022 Cl. 9.1", frameworkRef: "9.1", moduleRef: "kpi_measurement" }),
    mkReq("IS-9.2", "proof", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 9.2", frameworkRef: "9.2", moduleRef: "internal_audit" }),
    mkReq("IS-9.3", "sign-off", { priority: "P0", frequency: "annual", legalRef: "ISO 27001:2022 Cl. 9.3", frameworkRef: "9.3", moduleRef: "management_review", requiredSignOffRole: "ceo" }),
    // Clause 10: Improvement
    mkReq("IS-10.1", "proof", { priority: "P1", frequency: "ongoing", legalRef: "ISO 27001:2022 Cl. 10.1", frameworkRef: "10.1", moduleRef: "improvement_item" }),
    mkReq("IS-10.2", "document", { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 Cl. 10.2", frameworkRef: "10.2" }),
  ],

  // ── Annex A: Organizational controls (A.5.1–A.5.37) ───────────────────────
  "organizational-controls": () => [
    mkReq("A.5.1",  "document",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.1",  frameworkRef: "A.5.1",  moduleRef: "policy" }),
    mkReq("A.5.2",  "document",  { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.2",  frameworkRef: "A.5.2" }),
    mkReq("A.5.3",  "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.3",  frameworkRef: "A.5.3" }),
    mkReq("A.5.4",  "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.4",  frameworkRef: "A.5.4" }),
    mkReq("A.5.5",  "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.5",  frameworkRef: "A.5.5" }),
    mkReq("A.5.6",  "proof",     { priority: "P2", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.6",  frameworkRef: "A.5.6" }),
    mkReq("A.5.7",  "proof",     { priority: "P1", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.5.7",  frameworkRef: "A.5.7" }),
    mkReq("A.5.8",  "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.8",  frameworkRef: "A.5.8" }),
    mkReq("A.5.9",  "technical", { priority: "P0", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.5.9",  frameworkRef: "A.5.9",  moduleRef: "asset" }),
    mkReq("A.5.10", "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.10", frameworkRef: "A.5.10", moduleRef: "policy" }),
    mkReq("A.5.11", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.11", frameworkRef: "A.5.11" }),
    mkReq("A.5.12", "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.12", frameworkRef: "A.5.12" }),
    mkReq("A.5.13", "technical", { priority: "P2", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.13", frameworkRef: "A.5.13" }),
    mkReq("A.5.14", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.14", frameworkRef: "A.5.14" }),
    mkReq("A.5.15", "document",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.15", frameworkRef: "A.5.15", moduleRef: "policy" }),
    mkReq("A.5.16", "technical", { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.16", frameworkRef: "A.5.16" }),
    mkReq("A.5.17", "technical", { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.17", frameworkRef: "A.5.17" }),
    mkReq("A.5.18", "proof",     { priority: "P0", frequency: "quarterly", legalRef: "ISO 27001:2022 A.5.18", frameworkRef: "A.5.18" }),
    mkReq("A.5.19", "document",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.19", frameworkRef: "A.5.19", moduleRef: "supplier" }),
    mkReq("A.5.20", "document",  { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.20", frameworkRef: "A.5.20", moduleRef: "supplier" }),
    mkReq("A.5.21", "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.21", frameworkRef: "A.5.21", moduleRef: "supplier" }),
    mkReq("A.5.22", "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.22", frameworkRef: "A.5.22", moduleRef: "supplier" }),
    mkReq("A.5.23", "document",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.23", frameworkRef: "A.5.23", moduleRef: "supplier" }),
    mkReq("A.5.24", "document",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.24", frameworkRef: "A.5.24", moduleRef: "policy" }),
    mkReq("A.5.25", "document",  { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.25", frameworkRef: "A.5.25", moduleRef: "incident" }),
    mkReq("A.5.26", "proof",     { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.26", frameworkRef: "A.5.26", moduleRef: "incident" }),
    mkReq("A.5.27", "proof",     { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.27", frameworkRef: "A.5.27", moduleRef: "improvement_item" }),
    mkReq("A.5.28", "document",  { priority: "P2", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.28", frameworkRef: "A.5.28" }),
    mkReq("A.5.29", "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.29", frameworkRef: "A.5.29", moduleRef: "policy" }),
    mkReq("A.5.30", "technical", { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.30", frameworkRef: "A.5.30" }),
    mkReq("A.5.31", "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.31", frameworkRef: "A.5.31" }),
    mkReq("A.5.32", "proof",     { priority: "P2", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.32", frameworkRef: "A.5.32" }),
    mkReq("A.5.33", "technical", { priority: "P1", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.5.33", frameworkRef: "A.5.33" }),
    mkReq("A.5.34", "document",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.34", frameworkRef: "A.5.34" }),
    mkReq("A.5.35", "proof",     { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.35", frameworkRef: "A.5.35", moduleRef: "internal_audit" }),
    mkReq("A.5.36", "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.5.36", frameworkRef: "A.5.36" }),
    mkReq("A.5.37", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.5.37", frameworkRef: "A.5.37" }),
  ],

  // ── Annex A: People controls (A.6.1–A.6.8) ─────────────────────────────────
  "people-controls": () => [
    mkReq("A.6.1", "proof",     { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.6.1", frameworkRef: "A.6.1" }),
    mkReq("A.6.2", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.6.2", frameworkRef: "A.6.2" }),
    mkReq("A.6.3", "training",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.6.3", frameworkRef: "A.6.3", moduleRef: "training_record" }),
    mkReq("A.6.4", "document",  { priority: "P2", frequency: "on-change", legalRef: "ISO 27001:2022 A.6.4", frameworkRef: "A.6.4" }),
    mkReq("A.6.5", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.6.5", frameworkRef: "A.6.5" }),
    mkReq("A.6.6", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.6.6", frameworkRef: "A.6.6" }),
    mkReq("A.6.7", "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.6.7", frameworkRef: "A.6.7" }),
    mkReq("A.6.8", "proof",     { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.6.8", frameworkRef: "A.6.8", moduleRef: "incident" }),
  ],

  // ── Annex A: Physical controls (A.7.1–A.7.14) ──────────────────────────────
  "physical-controls": () => [
    mkReq("A.7.1",  "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.1",  frameworkRef: "A.7.1" }),
    mkReq("A.7.2",  "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.2",  frameworkRef: "A.7.2" }),
    mkReq("A.7.3",  "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.3",  frameworkRef: "A.7.3" }),
    mkReq("A.7.4",  "technical", { priority: "P2", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.7.4",  frameworkRef: "A.7.4" }),
    mkReq("A.7.5",  "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.5",  frameworkRef: "A.7.5" }),
    mkReq("A.7.6",  "document",  { priority: "P2", frequency: "on-change", legalRef: "ISO 27001:2022 A.7.6",  frameworkRef: "A.7.6" }),
    mkReq("A.7.7",  "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.7",  frameworkRef: "A.7.7" }),
    mkReq("A.7.8",  "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.8",  frameworkRef: "A.7.8" }),
    mkReq("A.7.9",  "document",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.9",  frameworkRef: "A.7.9" }),
    mkReq("A.7.10", "proof",     { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.7.10", frameworkRef: "A.7.10" }),
    mkReq("A.7.11", "proof",     { priority: "P2", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.11", frameworkRef: "A.7.11" }),
    mkReq("A.7.12", "proof",     { priority: "P2", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.12", frameworkRef: "A.7.12" }),
    mkReq("A.7.13", "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.7.13", frameworkRef: "A.7.13" }),
    mkReq("A.7.14", "proof",     { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.7.14", frameworkRef: "A.7.14" }),
  ],

  // ── Annex A: Technological controls (A.8.1–A.8.34) ─────────────────────────
  "technological-controls": () => [
    mkReq("A.8.1",  "technical", { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.1",  frameworkRef: "A.8.1",  moduleRef: "asset" }),
    mkReq("A.8.2",  "proof",     { priority: "P0", frequency: "quarterly", legalRef: "ISO 27001:2022 A.8.2",  frameworkRef: "A.8.2" }),
    mkReq("A.8.3",  "technical", { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.3",  frameworkRef: "A.8.3" }),
    mkReq("A.8.4",  "technical", { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.4",  frameworkRef: "A.8.4" }),
    mkReq("A.8.5",  "technical", { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.5",  frameworkRef: "A.8.5" }),
    mkReq("A.8.6",  "proof",     { priority: "P1", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.8.6",  frameworkRef: "A.8.6" }),
    mkReq("A.8.7",  "technical", { priority: "P0", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.8.7",  frameworkRef: "A.8.7" }),
    mkReq("A.8.8",  "technical", { priority: "P0", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.8.8",  frameworkRef: "A.8.8" }),
    mkReq("A.8.9",  "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.9",  frameworkRef: "A.8.9" }),
    mkReq("A.8.10", "proof",     { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.10", frameworkRef: "A.8.10" }),
    mkReq("A.8.11", "technical", { priority: "P2", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.11", frameworkRef: "A.8.11" }),
    mkReq("A.8.12", "technical", { priority: "P1", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.8.12", frameworkRef: "A.8.12" }),
    mkReq("A.8.13", "technical", { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.13", frameworkRef: "A.8.13" }),
    mkReq("A.8.14", "proof",     { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.14", frameworkRef: "A.8.14" }),
    mkReq("A.8.15", "technical", { priority: "P0", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.8.15", frameworkRef: "A.8.15" }),
    mkReq("A.8.16", "technical", { priority: "P0", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.8.16", frameworkRef: "A.8.16" }),
    mkReq("A.8.17", "technical", { priority: "P2", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.8.17", frameworkRef: "A.8.17" }),
    mkReq("A.8.18", "proof",     { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.18", frameworkRef: "A.8.18" }),
    mkReq("A.8.19", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.19", frameworkRef: "A.8.19" }),
    mkReq("A.8.20", "technical", { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.20", frameworkRef: "A.8.20" }),
    mkReq("A.8.21", "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.21", frameworkRef: "A.8.21" }),
    mkReq("A.8.22", "technical", { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.22", frameworkRef: "A.8.22" }),
    mkReq("A.8.23", "technical", { priority: "P2", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.23", frameworkRef: "A.8.23" }),
    mkReq("A.8.24", "document",  { priority: "P0", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.24", frameworkRef: "A.8.24", moduleRef: "policy" }),
    mkReq("A.8.25", "document",  { priority: "P1", frequency: "annual",    legalRef: "ISO 27001:2022 A.8.25", frameworkRef: "A.8.25" }),
    mkReq("A.8.26", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.26", frameworkRef: "A.8.26" }),
    mkReq("A.8.27", "document",  { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.27", frameworkRef: "A.8.27" }),
    mkReq("A.8.28", "proof",     { priority: "P1", frequency: "ongoing",   legalRef: "ISO 27001:2022 A.8.28", frameworkRef: "A.8.28" }),
    mkReq("A.8.29", "technical", { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.29", frameworkRef: "A.8.29" }),
    mkReq("A.8.30", "document",  { priority: "P2", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.30", frameworkRef: "A.8.30" }),
    mkReq("A.8.31", "technical", { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.31", frameworkRef: "A.8.31" }),
    mkReq("A.8.32", "proof",     { priority: "P0", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.32", frameworkRef: "A.8.32", moduleRef: "change_request" }),
    mkReq("A.8.33", "proof",     { priority: "P1", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.33", frameworkRef: "A.8.33" }),
    mkReq("A.8.34", "document",  { priority: "P2", frequency: "on-change", legalRef: "ISO 27001:2022 A.8.34", frameworkRef: "A.8.34" }),
  ],
};

export function getIso27001RequirementsForCategory(slug: string): FrameworkRequirement[] {
  return REQUIREMENTS_BY_SLUG[slug]?.() ?? [];
}
