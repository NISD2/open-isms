import { z } from "zod";
import type { PolicyConfigMap, PolicyType } from "./policy-config-defaults";

// Per-type Zod validators for the JSONB config. The policy editor saves through them and the walk
// reads the crypto list with the same one.
const cryptoConfigSchema = z.object({
  algorithms: z.array(
    z.object({
      category: z.enum(["symmetric", "hash", "asymmetric", "key_exchange", "tls"]),
      algorithm: z.string().min(1).max(100),
      keyLength: z.string().max(50).optional(),
      status: z.enum(["approved", "deprecated", "prohibited"]),
    }),
  ),
  minTlsVersion: z.enum(["tls_1_2", "tls_1_3"]),
  keyRotationFrequencyYears: z.number().int().min(1).max(10),
  triggerRotationOnCompromise: z.boolean(),
  reviewCycleYears: z.number().int().min(1).max(10),
  postQuantumReadiness: z.boolean(),
});

const accessControlConfigSchema = z.object({
  model: z.enum(["rbac", "abac", "hybrid"]),
  reviewFrequency: z.object({
    standard: z.string().min(1).max(100),
    privileged: z.string().min(1).max(100),
  }),
  deprovisioningSlaHours: z.number().int().min(1).max(720),
  sharedAccountPolicy: z.enum(["prohibited", "documented_exceptions"]),
  authReviewCycleYears: z.number().int().min(1).max(10),
});

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

const patchMgmtConfigSchema = z.object({
  patchSlaHours: z.object({
    critical: z.number().int().min(1).max(8760),
    high: z.number().int().min(1).max(8760),
    medium: z.number().int().min(1).max(8760),
    low: z.number().int().min(1).max(8760),
  }),
  reviewCycleYears: z.number().int().min(1).max(10),
});

export const POLICY_CONFIG_SCHEMAS: {
  [K in PolicyType]: z.ZodType<PolicyConfigMap[K]>;
} = {
  crypto: cryptoConfigSchema,
  access_control: accessControlConfigSchema,
  procurement: procurementConfigSchema,
  secure_dev: secureDevConfigSchema,
  patch_mgmt: patchMgmtConfigSchema,
};
