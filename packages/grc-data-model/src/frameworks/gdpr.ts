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
  // nationalUrl stays empty even though §38 BDSG is what actually triggers the
  // appointment for a German controller. The GDPR applies directly; §38 is an
  // Art. 37(4) opening-clause addition, not a transposition, so the BDSG cite
  // travels in the requirement's legalRef rather than as a second citation row.
  { id: "gdpr-cat-06", code: "DPO", slug: "gdpr-data-protection-officer",
    referenceUrl: "https://gdpr-info.eu/art-37-gdpr/", nationalUrl: "",
    sortOrder: 6, estimatedMinutes: 45, relevantRoles: ["legal", "ceo"] },
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
    // Art. 34 is a second, separate addressee: the data subjects themselves,
    // owed only where the breach is likely to result in a HIGH risk to them.
    // Art. 33 notification to the authority does not discharge it, and the
    // Art. 34(3) carve-outs (data rendered unintelligible, risk since
    // mitigated, disproportionate effort) are decided per breach.
    mkReq("G-BRC.3", "document", { legalRef: "GDPR Art. 34", frameworkRef: "Art. 34", moduleRef: "policy", priority: "P1", frequency: "on-change" }),
  ],
  "gdpr-data-subject-rights": () => [
    // The one-month deadline this requirement asserts is Art. 12(3); the
    // rights themselves are Art. 15-22. Art. 12(4)-(6) carry the refusal,
    // fee and identity-doubt rules the same workflow has to handle.
    // "ongoing", not "on-change": the clock starts when a request arrives,
    // which is not a change to anything the company controls.
    mkReq("G-DSR.1", "document", { legalRef: "GDPR Art. 12(3)-(6), Art. 15-22", frameworkRef: "Art. 12-22", priority: "P1", frequency: "ongoing" }),
  ],
  "gdpr-data-protection-officer": () => [
    // The GDPR itself only compels appointment in the three Art. 37(1) cases,
    // none of which catch an ordinary Mittelstand controller. §38(1) BDSG uses
    // the Art. 37(4) opening clause to add a German threshold that does: 20
    // persons "ständig mit der automatisierten Verarbeitung personenbezogener
    // Daten beschäftigt", plus two headcount-independent triggers. Almost every
    // company in the 50-250 band is over that line, so this is the GDPR duty
    // German SMEs miss most often.
    // "on-change": the threshold is dynamic, so the test is re-run when
    // headcount or the kind of processing changes, not on a review cycle.
    mkReq("G-DPO.1", "document", { legalRef: "GDPR Art. 37-39, §38 BDSG", frameworkRef: "Art. 37-39", priority: "P0", frequency: "on-change" }),
  ],
};

export function getGdprRequirementsForCategory(slug: string): FrameworkRequirement[] {
  const builder = REQUIREMENTS_BY_SLUG[slug];
  if (!builder) return [];
  return builder();
}
