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

const mkReq = makeRequirementFactory("gdpr-req");

export const gdprCategories: FrameworkCategory[] = [
  { id: "gdpr-cat-01", code: "DPA", slug: "gdpr-processor-agreements",
    referenceUrl: "https://gdpr-info.eu/art-28-gdpr/", nationalUrl: "",
    sortOrder: 1, estimatedMinutes: 60, relevantRoles: ["legal", "ciso"] },
  { id: "gdpr-cat-02", code: "ROP", slug: "gdpr-records-of-processing",
    referenceUrl: "https://gdpr-info.eu/art-30-gdpr/", nationalUrl: "",
    sortOrder: 2, estimatedMinutes: 90, relevantRoles: ["legal"] },
  { id: "gdpr-cat-03", code: "TOM", slug: "gdpr-toms",
    referenceUrl: "https://gdpr-info.eu/art-32-gdpr/", nationalUrl: "",
    sortOrder: 3, estimatedMinutes: 60, relevantRoles: ["ciso"] },
  { id: "gdpr-cat-04", code: "BRC", slug: "gdpr-breach-response",
    referenceUrl: "https://gdpr-info.eu/art-33-gdpr/", nationalUrl: "",
    sortOrder: 4, estimatedMinutes: 45, relevantRoles: ["ciso", "legal"] },
  { id: "gdpr-cat-05", code: "DSR", slug: "gdpr-data-subject-rights",
    // Chapter III, not Art. 15 alone: this category spans Art. 12-22.
    referenceUrl: "https://gdpr-info.eu/chapter-3/", nationalUrl: "",
    sortOrder: 5, estimatedMinutes: 60, relevantRoles: ["legal"] },
];

/**
 * `frequency` is stated on every requirement below rather than left to the
 * factory default of "annual". The default silently gave an annual review
 * cadence to the two duties the GDPR triggers per event rather than per
 * cycle (G-BRC.2, G-DSR.1).
 */
const REQUIREMENTS_BY_SLUG: Record<string, () => FrameworkRequirement[]> = {
  "gdpr-processor-agreements": () => [
    mkReq("G-DPA.1", "document", { legalRef: "GDPR Art. 28(3)", frameworkRef: "Art. 28", moduleRef: "supplier", priority: "P1", frequency: "annual" }),
    mkReq("G-DPA.2", "document", { legalRef: "GDPR Art. 28(2)/(4)", frameworkRef: "Art. 28", moduleRef: "supplier", priority: "P1", frequency: "annual" }),
  ],
  "gdpr-records-of-processing": () => [
    mkReq("G-ROP.1", "document", { legalRef: "GDPR Art. 30(1)", frameworkRef: "Art. 30", moduleRef: "asset", priority: "P0", frequency: "annual" }),
  ],
  "gdpr-toms": () => [
    mkReq("G-TOM.1", "document", { legalRef: "GDPR Art. 32(1)", frameworkRef: "Art. 32", moduleRef: "policy", priority: "P0", frequency: "annual" }),
  ],
  "gdpr-breach-response": () => [
    mkReq("G-BRC.1", "document", { legalRef: "GDPR Art. 33", frameworkRef: "Art. 33", moduleRef: "policy", priority: "P0", frequency: "annual" }),
    // Art. 33(5) documents each breach as it happens, not on a review cycle.
    mkReq("G-BRC.2", "document", { legalRef: "GDPR Art. 33(5)", frameworkRef: "Art. 33", moduleRef: "incident", priority: "P1", frequency: "on-change" }),
  ],
  "gdpr-data-subject-rights": () => [
    // The one-month deadline this requirement asserts is Art. 12(3); the
    // rights themselves are Art. 15-22. Art. 12(4)-(6) carry the refusal,
    // fee and identity-doubt rules the same workflow has to handle.
    // "ongoing", not "on-change": the clock starts when a request arrives,
    // which is not a change to anything the company controls.
    mkReq("G-DSR.1", "document", { legalRef: "GDPR Art. 12(3)-(6), Art. 15-22", frameworkRef: "Art. 12-22", priority: "P1", frequency: "ongoing" }),
  ],
};

export function getGdprRequirementsForCategory(slug: string): FrameworkRequirement[] {
  const builder = REQUIREMENTS_BY_SLUG[slug];
  if (!builder) return [];
  return builder();
}
