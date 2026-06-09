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
    referenceUrl: "https://gdpr-info.eu/art-15-gdpr/", nationalUrl: "",
    sortOrder: 5, estimatedMinutes: 60, relevantRoles: ["legal"] },
];

const REQUIREMENTS_BY_SLUG: Record<string, () => FrameworkRequirement[]> = {
  "gdpr-processor-agreements": () => [
    mkReq("G-DPA.1", "document", { legalRef: "GDPR Art. 28(3)", frameworkRef: "Art. 28", moduleRef: "supplier", priority: "P1" }),
    mkReq("G-DPA.2", "document", { legalRef: "GDPR Art. 28(2)/(4)", frameworkRef: "Art. 28", moduleRef: "supplier", priority: "P1" }),
  ],
  "gdpr-records-of-processing": () => [
    mkReq("G-ROP.1", "document", { legalRef: "GDPR Art. 30(1)", frameworkRef: "Art. 30", moduleRef: "asset", priority: "P0" }),
  ],
  "gdpr-toms": () => [
    mkReq("G-TOM.1", "document", { legalRef: "GDPR Art. 32(1)", frameworkRef: "Art. 32", moduleRef: "policy", priority: "P0" }),
  ],
  "gdpr-breach-response": () => [
    mkReq("G-BRC.1", "document", { legalRef: "GDPR Art. 33", frameworkRef: "Art. 33", moduleRef: "policy", priority: "P0" }),
    mkReq("G-BRC.2", "document", { legalRef: "GDPR Art. 33(5)", frameworkRef: "Art. 33", moduleRef: "incident", priority: "P1" }),
  ],
  "gdpr-data-subject-rights": () => [
    mkReq("G-DSR.1", "document", { legalRef: "GDPR Art. 15-22", frameworkRef: "Art. 15-22", priority: "P1" }),
  ],
};

export function getGdprRequirementsForCategory(slug: string): FrameworkRequirement[] {
  const builder = REQUIREMENTS_BY_SLUG[slug];
  if (!builder) return [];
  return builder();
}
