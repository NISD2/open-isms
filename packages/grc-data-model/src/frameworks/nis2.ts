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

const mkReq = makeRequirementFactory("nis2-req");

export const nis2Categories: FrameworkCategory[] = [
  { id: "cat-01", code: "GOV", slug: "governance", name: "Governance", description: "Management responsibilities, accountability, policy approval.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_20.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__38.html", sortOrder: 1, estimatedMinutes: 45, relevantRoles: ["ceo"], grundschutzModule: "ISMS.1" },
  { id: "cat-02", code: "RSK", slug: "risk-management", name: "Risk Management", description: "Risk identification, assessment, treatment, monitoring.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 2, estimatedMinutes: 60, relevantRoles: ["ciso"], grundschutzModule: "BSI-200-3" },
  { id: "cat-03", code: "INC", slug: "incident-handling", name: "Incident Handling", description: "Detection, response, notification, post-mortem.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_23.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__32.html", sortOrder: 8, estimatedMinutes: 50, relevantRoles: ["ciso"], grundschutzModule: "DER.2.1" },
  { id: "cat-04", code: "BCP", slug: "business-continuity", name: "Business Continuity", description: "Continuity planning, backups, recovery.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 9, estimatedMinutes: 50, relevantRoles: ["coo"], grundschutzModule: "DER.4" },
  { id: "cat-05", code: "SUP", slug: "supply-chain", name: "Suppliers and Supply Chain", description: "Supplier risk and contractual security obligations.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 3, estimatedMinutes: 40, relevantRoles: ["cpo"], grundschutzModule: "OPS.2.3" },
  { id: "cat-06", code: "PRO", slug: "procurement", name: "Patching and Vulnerability", description: "Ongoing patch and vulnerability management.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 7, estimatedMinutes: 45, relevantRoles: ["cto"], grundschutzModule: "OPS.1.1.3" },
  { id: "cat-07", code: "EFF", slug: "effectiveness", name: "Effectiveness Review", description: "KPIs, audits, corrective actions, PDCA.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 11, estimatedMinutes: 40, relevantRoles: ["ciso"], grundschutzModule: "DER.3.1" },
  { id: "cat-08", code: "TRN", slug: "training", name: "Training", description: "Awareness training for all staff and management.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 10, estimatedMinutes: 35, relevantRoles: ["ciso"], grundschutzModule: "ORP.3" },
  { id: "cat-09", code: "CRY", slug: "cryptography", name: "Cryptography", description: "Encryption, key management, signatures.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 4, estimatedMinutes: 30, relevantRoles: ["cto"], grundschutzModule: "CON.1" },
  { id: "cat-10", code: "ACC", slug: "access-control", name: "Access Control", description: "Identity, authorisation, role and permission management.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 5, estimatedMinutes: 40, relevantRoles: ["ciso", "hr_director"], grundschutzModule: "ORP.4" },
  { id: "cat-11", code: "AUT", slug: "authentication", name: "Authentication", description: "MFA, password policy, credential protection.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__30.html", sortOrder: 6, estimatedMinutes: 35, relevantRoles: ["cto"], grundschutzModule: "ORP.4" },
  { id: "cat-12", code: "REG", slug: "registration", name: "Registration", description: "NIS 2 entity registration with the national authority.", referenceUrl: "https://www.nis-2-directive.com/NIS_2_Directive_Article_3.html", nationalUrl: "https://www.gesetze-im-internet.de/bsig_2025/__33.html", sortOrder: 0, estimatedMinutes: 30, relevantRoles: ["legal"], grundschutzModule: "ISMS.1" },
];

// Legal references verified verbatim against the enacted BSIG (gesetze-im-internet.de/bsig_2025,
// in force 06.12.2025, BGBl. 2025 I Nr. 301) and the OJ text of CIR (EU) 2024/2690
// (publications.europa.eu/resource/celex/32024R2690). CIR Annex sub-numbering bounds:
// point 5 = 5.1 (5.1.1-5.1.7) + 5.2 only; point 7 = 7.1-7.3; point 8 = 8.1 + 8.2 only;
// point 9 = 9.1-9.3 (key management = 9.2(c)(i)-(xii)). The CIR binds §60(1)-type entities
// directly (§30(3) BSIG); for other entities it is the platform's adopted structure.
const REQUIREMENTS_BY_SLUG: Record<string, () => FrameworkRequirement[]> = {
  governance: () => [
    mkReq("1.1", "training", { priority: "P1", frequency: "every-3-years", legalRef: "§38(3) BSIG", frameworkRef: "Art. 20(2)" }),
    mkReq("1.2", "proof", { priority: "P1", frequency: "on-change", legalRef: "§30(1) BSIG, CIR 1.2", frameworkRef: "Art. 21(2)(a)", cirReference: "1.2" }),
    mkReq("1.3", "proof", { priority: "P1", frequency: "annual", legalRef: "§38(1) BSIG, CIR 1.1.1(e)", frameworkRef: "Art. 20(1)", cirReference: "1.1.1(e)", requiredSignOffRole: "ceo" }),
    mkReq("1.4", "sign-off", { frequency: "on-change", legalRef: "§38(2) BSIG", frameworkRef: "Art. 20(1)", requiredSignOffRole: "ceo" }),
  ],
  "risk-management": () => [
    mkReq("2.1", "document", { priority: "P0", frequency: "on-change", legalRef: "§30(2) Nr. 1 BSIG, CIR 2.1.2", frameworkRef: "Art. 21(2)(a)", cirReference: "2.1.2" }),
    mkReq("2.2", "technical", { priority: "P0", frequency: "ongoing", legalRef: "§30(2) Nr. 1 und 9 BSIG, CIR 12", frameworkRef: "Art. 21(2)(a), Art. 21(2)(i)", cirReference: "12.1, 12.4" }),
    mkReq("2.3", "technical", { priority: "P1", legalRef: "§30(2) Nr. 1 BSIG, CIR 2.1.1, 2.1.4", frameworkRef: "Art. 21(2)(a)", cirReference: "2.1.1, 2.1.3, 2.1.4" }),
    // 1.1.2 and 2.1.4 carry the "at least annually" floor this requirement's annual
    // frequency actually rests on; 1.1.1(k) and 2.1.1 only cover the approval itself.
    mkReq("2.4", "sign-off", { priority: "P0", frequency: "annual", legalRef: "§38(1) BSIG, CIR 1.1.1(k), 1.1.2, 2.1.1, 2.1.4", frameworkRef: "Art. 20(1), Art. 21(2)(a)", cirReference: "1.1.1(k), 1.1.2, 2.1.1, 2.1.4", requiredSignOffRole: "ceo" }),
  ],
  "incident-handling": () => [
    mkReq("3.1", "document", { priority: "P0", legalRef: "§30(2) Nr. 2 BSIG, CIR 3.1", frameworkRef: "Art. 21(2)(b)", cirReference: "3.1" }),
    // Quarterly, not the default annual: CIR 3.4.2(b) is the implementing act's only
    // hard interval, and it feeds the Art. 4 recurring-incident aggregation rule.
    mkReq("3.2", "document", { priority: "P1", frequency: "quarterly", legalRef: "§30(2) Nr. 2, §2 Nr. 11 BSIG, CIR 3.2-3.4, CIR Art. 4", frameworkRef: "Art. 21(2)(b), Art. 23(3)", cirReference: "3.2, 3.3, 3.4" }),
    mkReq("3.3", "proof", { priority: "P0", frequency: "annual", legalRef: "§32(1) Nr. 1-4, §32(2) BSIG", frameworkRef: "Art. 23(4)" }),
    mkReq("3.4", "proof", { priority: "P2", frequency: "annual", legalRef: "§30(2) Nr. 2+6 BSIG, CIR 3.5", frameworkRef: "Art. 21(2)(f)", cirReference: "3.5" }),
    mkReq("3.5", "document", { priority: "P1", frequency: "annual", legalRef: "§30(2) Nr. 2 BSIG, CIR 3.6", frameworkRef: "Art. 21(2)(b)", cirReference: "3.6" }),
  ],
  "business-continuity": () => [
    mkReq("4.1", "document", { priority: "P1", legalRef: "§30(2) Nr. 3 BSIG, CIR 4.1.3", frameworkRef: "Art. 21(2)(c)", cirReference: "4.1.3" }),
    mkReq("4.2", "document", { priority: "P1", legalRef: "§30(2) Nr. 3 BSIG, CIR 4.1, 4.3", frameworkRef: "Art. 21(2)(c)", cirReference: "4.1, 4.3", requiredSignOffRole: "ceo" }),
    mkReq("4.3", "document", { priority: "P1", legalRef: "§30(2) Nr. 3 BSIG, CIR 4.1.2", frameworkRef: "Art. 21(2)(c)", cirReference: "4.1.2" }),
    mkReq("4.4", "technical", { priority: "P1", legalRef: "§30(2) Nr. 3 BSIG, CIR 4.2", frameworkRef: "Art. 21(2)(c)", cirReference: "4.2" }),
    mkReq("4.5", "proof", { priority: "P1", frequency: "annual", legalRef: "§30(2) Nr. 3+6 BSIG, CIR 4.1.4, 4.3.4", frameworkRef: "Art. 21(2)(c), Art. 21(2)(f)", cirReference: "4.1.4, 4.2.6, 4.3.4" }),
  ],
  "supply-chain": () => [
    mkReq("5.1", "document", { priority: "P1", frequency: "annual", legalRef: "§30(2) Nr. 4 BSIG, CIR 5.1-5.2", frameworkRef: "Art. 21(2)(d)", cirReference: "5.1, 5.2" }),
    mkReq("5.2", "document", { priority: "P1", frequency: "on-change", legalRef: "§30(2) Nr. 4 BSIG, CIR 5.1.4", frameworkRef: "Art. 21(2)(d)", cirReference: "5.1.4" }),
    mkReq("5.3", "proof", { priority: "P1", legalRef: "§30(2) Nr. 4 BSIG, CIR 5.1.6, 5.1.7", frameworkRef: "Art. 21(3)", cirReference: "5.1.6, 5.1.7" }),
    mkReq("5.4", "proof", { priority: "P1", frequency: "ongoing", legalRef: "§30(2) Nr. 4 BSIG, CIR 5.1.4(d)", frameworkRef: "Art. 21(2)(d)", cirReference: "5.1.4(d)" }),
  ],
  procurement: () => [
    mkReq("6.1", "document", { priority: "P1", legalRef: "§30(2) Nr. 5 BSIG, CIR 6.1", frameworkRef: "Art. 21(2)(e)", cirReference: "6.1" }),
    mkReq("6.2", "document", { priority: "P1", legalRef: "§30(2) Nr. 5 BSIG, CIR 6.2, 6.3", frameworkRef: "Art. 21(2)(e)", cirReference: "6.2, 6.3" }),
    mkReq("6.3", "technical", { priority: "P1", frequency: "ongoing", legalRef: "§30(2) Nr. 5 BSIG, CIR 6.5, 6.10", frameworkRef: "Art. 21(2)(e)", cirReference: "6.5, 6.10" }),
    mkReq("6.4", "technical", { priority: "P1", frequency: "ongoing", legalRef: "§30(2) Nr. 5 BSIG, CIR 6.6", frameworkRef: "Art. 21(2)(e)", cirReference: "6.6" }),
    mkReq("6.5", "document", { priority: "P1", legalRef: "§30(2) Nr. 5 BSIG, CIR 6.4", frameworkRef: "Art. 21(2)(e)", cirReference: "6.4" }),
  ],
  effectiveness: () => [
    mkReq("7.1", "proof", { priority: "P1", frequency: "quarterly", legalRef: "§30(2) Nr. 6 BSIG, CIR 7.1, 7.2", frameworkRef: "Art. 21(2)(f)", cirReference: "7.1, 7.2" }),
    mkReq("7.2", "proof", { priority: "P1", legalRef: "§30(2) Nr. 6 BSIG, CIR 2.3", frameworkRef: "Art. 21(2)(f)", cirReference: "2.3" }),
    mkReq("7.3", "sign-off", { priority: "P1", legalRef: "§30(2) Nr. 6 BSIG, CIR 2.2.1, §38(1)", frameworkRef: "Art. 21(2)(f), Art. 20(1)", cirReference: "2.2.1", requiredSignOffRole: "ceo" }),
    mkReq("7.4", "document", { priority: "P1", frequency: "ongoing", legalRef: "§30(2) Nr. 6 BSIG, CIR 2.3.3, Art. 21(4)", frameworkRef: "Art. 21(2)(f), Art. 21(4)", cirReference: "2.3.3" }),
  ],
  training: () => [
    mkReq("8.1", "document", { priority: "P1", legalRef: "§30(2) Nr. 1+7 BSIG, CIR 1.1.1(i), 1.2.2", frameworkRef: "Art. 21(2)(a), Art. 21(2)(g)", cirReference: "1.1.1(i), 1.2.2" }),
    mkReq("8.2", "training", { priority: "P1", legalRef: "§30(2) Nr. 7 BSIG, CIR 8.1", frameworkRef: "Art. 21(2)(g)", cirReference: "8.1" }),
    mkReq("8.3", "training", { priority: "P1", legalRef: "§30(2) Nr. 7 BSIG, CIR 8.2", frameworkRef: "Art. 21(2)(g)", cirReference: "8.2" }),
    mkReq("8.4", "proof", { priority: "P2", frequency: "annual", legalRef: "§30(2) Nr. 6+7 BSIG, CIR 8.1.3, 8.2.3", frameworkRef: "Art. 21(2)(g), Art. 21(2)(f)", cirReference: "8.1.3, 8.2.3" }),
  ],
  cryptography: () => [
    mkReq("9.1", "document", { priority: "P1", legalRef: "§30(2) Nr. 8 BSIG, CIR 9.1, 9.3, BSI TR-02102", frameworkRef: "Art. 21(2)(h)", cirReference: "9.1, 9.3" }),
    mkReq("9.2", "technical", { priority: "P1", legalRef: "§30(2) Nr. 8 BSIG, CIR 9.2(a)", frameworkRef: "Art. 21(2)(h)", cirReference: "9.2(a)" }),
    mkReq("9.3", "technical", { priority: "P1", legalRef: "§30(2) Nr. 8 BSIG, CIR 9.2(c)", frameworkRef: "Art. 21(2)(h)", cirReference: "9.2(c)" }),
  ],
  "access-control": () => [
    mkReq("10.1", "document", { priority: "P1", legalRef: "§30(2) Nr. 9 BSIG, CIR 11.1", frameworkRef: "Art. 21(2)(i)", cirReference: "11.1" }),
    mkReq("10.2", "technical", { priority: "P1", frequency: "on-change", legalRef: "§30(2) Nr. 9 BSIG, CIR 11.2, CIR 11.3", frameworkRef: "Art. 21(2)(i)", cirReference: "11.2, 11.3" }),
    mkReq("10.3", "document", { priority: "P1", frequency: "annual", legalRef: "§30(2) Nr. 9 BSIG, CIR 10.2, 10.3, 11.3", frameworkRef: "Art. 21(2)(i)", cirReference: "10.2, 10.3, 11.3" }),
    mkReq("10.4", "proof", { priority: "P1", frequency: "quarterly", legalRef: "§30(2) Nr. 9 BSIG, CIR 11.2.3, 11.3.3", frameworkRef: "Art. 21(2)(i)", cirReference: "11.2.3, 11.3.3" }),
  ],
  authentication: () => [
    mkReq("11.1", "technical", { priority: "P0", legalRef: "§30(2) Nr. 10 BSIG, CIR 11.7", frameworkRef: "Art. 21(2)(j)", cirReference: "11.7" }),
    mkReq("11.2", "document", { priority: "P1", legalRef: "§30(2) Nr. 10 BSIG", frameworkRef: "Art. 21(2)(j)" }),
    mkReq("11.3", "document", { priority: "P1", frequency: "annual", legalRef: "§30(2) Nr. 10 BSIG, CIR 11.6, NIST SP 800-63B", frameworkRef: "Art. 21(2)(j)", cirReference: "11.6" }),
  ],
  registration: () => [
    mkReq("12.1", "document", { priority: "P0", frequency: "on-change", legalRef: "§28, §33(1) BSIG", frameworkRef: "Art. 3(1)-(2)" }),
    mkReq("12.2", "proof", { priority: "P0", frequency: "one-time", legalRef: "§33(1) BSIG", frameworkRef: "Art. 3(3)-(4)" }),
    mkReq("12.3", "proof", { priority: "P1", frequency: "annual", legalRef: "§33(5) BSIG", frameworkRef: "Art. 3(4)" }),
    mkReq("12.4", "proof", { priority: "P2", frequency: "ongoing", legalRef: "§30(1) S. 3, §31(2), §39, §34 BSIG", cirReference: "1.1.1(h)" }),
  ],
};

const NIS2_MODULE_REF: Record<string, string> = {
  "1.1": "training_record", "1.2": "team",
  "2.2": "asset", "2.3": "risk",
  "3.1": "policy", "3.2": "incident", "3.3": "incident",
  "3.4": "exercise", "3.5": "improvement_item",
  "4.1": "policy", "4.2": "policy", "4.3": "asset",
  "4.4": "asset", "4.5": "exercise",
  "5.1": "supplier", "5.2": "supplier",
  "6.3": "vulnerability", "6.4": "patch_record", "6.5": "change_request",
  "7.1": "kpi_measurement", "7.2": "internal_audit",
  "7.3": "management_review", "7.4": "improvement_item",
  "8.1": "policy", "8.2": "training_record",
  "8.3": "training_record", "8.4": "kpi_measurement",
  "10.2": "asset",
  "12.2": "bsi_registration",
};

export function getNis2RequirementsForCategory(slug: string): FrameworkRequirement[] {
  const builder = REQUIREMENTS_BY_SLUG[slug];
  if (!builder) return [];
  const reqs = builder();
  for (const req of reqs) {
    req.moduleRef = NIS2_MODULE_REF[req.code] ?? null;
  }
  return reqs;
}
