/**
 * The GDPR categories' intake: what a GDPR requirement records as answers rather than in a
 * register. Most GDPR duties are kept in registers (the record of processing activities, the
 * supplier list) or written as documents, so most categories ask nothing here and their schema is
 * empty. Field names avoid the Uploaded/Documented/Published endings, which turn a field into an
 * upload (lib/forms/schema-introspect).
 */
import { z } from "zod";

/** Nothing asked: the category's duties are a register or a document. */
const NOTHING_ASKED = z.object({});

// ============================================================================
// DPO — Data protection officer (Art. 37 to 39 GDPR, § 38 BDSG)
// ============================================================================

export const DPO_SCHEMA = z.object({
  dpoDecision: z
    .enum(["required", "voluntary", "none"])
    .describe(
      "Whether the company designates a data protection officer, and whether it must (Art. 37(1) GDPR, § 38(1) BDSG)",
    ),
  dpoName: z
    .string()
    .max(255)
    .optional()
    .describe(
      "Who the data protection officer is: a person in the company or an external service",
    ),
  dpoContact: z
    .string()
    .max(255)
    .optional()
    .describe(
      "The contact details published for the data protection officer (Art. 37(7) GDPR)",
    ),
  dpoAuthorityNotifiedOn: z.coerce
    .date()
    .optional()
    .describe(
      "When the contact details were communicated to the supervisory authority (Art. 37(7) GDPR)",
    ),
});

// ============================================================================
// DSR — Requests from data subjects (Art. 12 to 22 GDPR, §§ 34, 35 BDSG)
// ============================================================================

export const DSR_SCHEMA = z.object({
  requestHandler: z
    .string()
    .max(255)
    .describe("Who in the company answers requests from data subjects"),
  requestAddress: z
    .string()
    .max(255)
    .describe("Where requests reach the company, for example an email address"),
});

// ============================================================================
// BRC — Personal data breaches (Art. 33, 34 GDPR)
// ============================================================================

export const BRC_SCHEMA = z.object({
  breachLead: z
    .string()
    .max(255)
    .describe(
      "Who takes charge when personal data is affected: hears of every breach first, decides with the data protection officer whether to notify, and makes the notification",
    ),
});

/** The GDPR categories' schemas, by category code (the registry is ./index). */
export const GDPR_SCHEMAS = {
  DPA: NOTHING_ASKED,
  ROP: NOTHING_ASKED,
  TOM: NOTHING_ASKED,
  BRC: BRC_SCHEMA,
  DSR: DSR_SCHEMA,
  DPO: DPO_SCHEMA,
  ACT: NOTHING_ASKED,
} as const;

/** Each intake field and the requirement codes it fills. */
export const GDPR_FIELD_MAPPING: Record<string, Record<string, string[]>> = {
  DPO: {
    dpoDecision: ["G-DPO.1"],
    dpoName: ["G-DPO.1"],
    dpoContact: ["G-DPO.1"],
    dpoAuthorityNotifiedOn: ["G-DPO.1"],
  },
  DSR: {
    requestHandler: ["G-DSR.1"],
    requestAddress: ["G-DSR.1"],
  },
  BRC: {
    breachLead: ["G-BRC.1"],
  },
};
