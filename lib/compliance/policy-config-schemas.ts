import { z } from "zod";
import type { PolicyType } from "./policy-config-defaults";

// The JSONB config of each structured policy editor. These schemas are its one source: the
// editors save through them, the walk reads the crypto list with them, and the config types in
// policy-config-defaults.ts are inferred from them.

const cryptoEntrySchema = z.object({
  category: z.enum(["symmetric", "hash", "asymmetric", "key_exchange", "tls"]),
  algorithm: z.string().min(1).max(100),
  keyLength: z.string().max(50).optional(),
  status: z.enum(["approved", "deprecated", "prohibited"]),
});

/** The kinds a crypto list groups its methods by, in the order a policy prints them. */
export const CRYPTO_CATEGORIES = cryptoEntrySchema.shape.category.options;
export type CryptoCategory = (typeof CRYPTO_CATEGORIES)[number];

/** Where a method stands: accepted, only kept for what exists, or not to be used. */
export const CRYPTO_STATUSES = cryptoEntrySchema.shape.status.options;
export type CryptoStatus = (typeof CRYPTO_STATUSES)[number];

// Crypto (9.1): BSI TR-02102
const cryptoConfigSchema = z.object({
  algorithms: z.array(cryptoEntrySchema),
  minTlsVersion: z.enum(["tls_1_2", "tls_1_3"]),
  keyRotationFrequencyYears: z.number().int().min(1).max(10),
  triggerRotationOnCompromise: z.boolean(),
  reviewCycleYears: z.number().int().min(1).max(10),
  postQuantumReadiness: z.boolean(),
});

// Access control (10.1): CIR 11.1, ORP.4
const accessControlConfigSchema = z.object({
  /** RBAC, ABAC or hybrid: CIR 11.1.1 */
  model: z.enum(["rbac", "abac", "hybrid"]),
  /** Standard and privileged review cadence: CIR 11.2.3, ORP.4.A4 */
  reviewFrequency: z.object({
    standard: z.string().min(1).max(100),
    privileged: z.string().min(1).max(100),
  }),
  /** Hours at most to revoke access on termination: CIR 11.2.1, ORP.4.A6 */
  deprovisioningSlaHours: z.number().int().min(1).max(720),
  /** Shared or generic accounts: CIR 11.5.3, ORP.4.A3 */
  sharedAccountPolicy: z.enum(["prohibited", "documented_exceptions"]),
  /** How often authentication methods are reviewed: CIR 11.6.4 */
  authReviewCycleYears: z.number().int().min(1).max(10),
});

// Procurement (6.1): CIR Art. 5
const procurementConfigSchema = z.object({
  thresholdEur: z.number().int().min(0),
  requiredClauses: z.object({
    cybersecurityRequirements: z.boolean(),
    trainingCertification: z.boolean(),
    backgroundChecks: z.boolean(),
    incidentNotification: z.boolean(),
    auditRights: z.boolean(),
    vulnerabilityDisclosure: z.boolean(),
    subcontractorFlowdown: z.boolean(),
    secureDecommissioning: z.boolean(),
  }),
  customClauses: z.array(
    z.object({
      clause: z.string().min(1).max(500),
      enabled: z.boolean(),
    }),
  ),
  evaluationCriteria: z.array(
    z.object({
      criterion: z.string().min(1).max(500),
      weight: z.number().int().min(0).max(100),
    }),
  ),
  reviewFrequency: z.string().min(1).max(100),
});

// Secure development (6.2): CIR Art. 6
const secureDevConfigSchema = z.object({
  sdlcFramework: z.enum(["owasp_samm", "bsimm", "ms_sdl", "custom"]),
  hardeningBaseline: z.enum(["cis", "bsi", "disa_stig", "custom"]),
  testingRequirements: z.object({
    sast: z.boolean(),
    dast: z.boolean(),
    sca: z.boolean(),
    pentest: z.boolean(),
    codeReview: z.boolean(),
  }),
  environmentSegregation: z.boolean(),
  reviewCycleYears: z.number().int().min(1).max(10),
});

// Patch management (6.4): CIR Art. 6(6), OPS.1.1.3
const patchMgmtConfigSchema = z.object({
  patchSlaHours: z.object({
    critical: z.number().int().min(1).max(8760),
    high: z.number().int().min(1).max(8760),
    medium: z.number().int().min(1).max(8760),
    low: z.number().int().min(1).max(8760),
  }),
  reviewCycleYears: z.number().int().min(1).max(10),
});

export const POLICY_CONFIG_SCHEMAS = {
  crypto: cryptoConfigSchema,
  access_control: accessControlConfigSchema,
  procurement: procurementConfigSchema,
  secure_dev: secureDevConfigSchema,
  patch_mgmt: patchMgmtConfigSchema,
} as const satisfies Record<PolicyType, z.ZodType>;

/** Each policy type's config, as its schema takes it. */
export type PolicyConfigMap = {
  [K in PolicyType]: z.infer<(typeof POLICY_CONFIG_SCHEMAS)[K]>;
};
