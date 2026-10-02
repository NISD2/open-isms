/**
 * Policy Config Defaults — BSI/CIR-sourced defaults for structured policy editors
 *
 * Each policy type has a TypeScript interface and a locale-aware factory.
 * Config is stored as JSONB — these interfaces type it at the app level.
 */

// ============================================================================
// Policy type enum
// ============================================================================

export const POLICY_TYPES = [
  "crypto",
  "access_control",
  "procurement",
  "secure_dev",
  "patch_mgmt",
] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

// ============================================================================
// Crypto (9.1) — BSI TR-02102
// ============================================================================

export interface CryptoAlgorithmEntry {
  category: "symmetric" | "hash" | "asymmetric" | "key_exchange" | "tls";
  algorithm: string;
  keyLength?: string;
  status: "approved" | "deprecated" | "prohibited";
}

export interface CryptoPolicyConfig {
  algorithms: CryptoAlgorithmEntry[];
  minTlsVersion: "tls_1_2" | "tls_1_3";
  keyRotationFrequencyYears: number;
  triggerRotationOnCompromise: boolean;
  reviewCycleYears: number;
  postQuantumReadiness: boolean;
}

// ============================================================================
// Access Control (10.1) — CIR 11.1, ORP.4
// ============================================================================

export interface AccessControlConfig {
  /** RBAC / ABAC / hybrid — CIR 11.1.1 */
  model: "rbac" | "abac" | "hybrid";
  /** Standard + privileged review cadence — CIR 11.2.3, ORP.4.A4 */
  reviewFrequency: { standard: string; privileged: string };
  /** Max hours to revoke access on termination — CIR 11.2.1, ORP.4.A6 */
  deprovisioningSlaHours: number;
  /** Shared/generic account policy — CIR 11.5.3, ORP.4.A3 */
  sharedAccountPolicy: "prohibited" | "documented_exceptions";
  /** How often to review auth methods — CIR 11.6.4 */
  authReviewCycleYears: number;
}

// ============================================================================
// Procurement (6.1) — CIR Art. 5
// ============================================================================

export interface ProcurementEvalCriterion {
  criterion: string;
  weight: number;
}

export interface ProcurementCustomClause {
  clause: string;
  enabled: boolean;
}

export interface ProcurementConfig {
  thresholdEur: number;
  requiredClauses: {
    cybersecurityRequirements: boolean;
    trainingCertification: boolean;
    backgroundChecks: boolean;
    incidentNotification: boolean;
    auditRights: boolean;
    vulnerabilityDisclosure: boolean;
    subcontractorFlowdown: boolean;
    secureDecommissioning: boolean;
  };
  customClauses: ProcurementCustomClause[];
  evaluationCriteria: ProcurementEvalCriterion[];
  reviewFrequency: string;
}

// ============================================================================
// Secure Dev (6.2) — CIR Art. 6
// ============================================================================

export interface SecureDevConfig {
  sdlcFramework: "owasp_samm" | "bsimm" | "ms_sdl" | "custom";
  hardeningBaseline: "cis" | "bsi" | "disa_stig" | "custom";
  testingRequirements: {
    sast: boolean;
    dast: boolean;
    sca: boolean;
    pentest: boolean;
    codeReview: boolean;
  };
  environmentSegregation: boolean;
  reviewCycleYears: number;
}

// ============================================================================
// Patch Management (6.4) — CIR Art. 6(6), OPS.1.1.3
// ============================================================================

export interface PatchSlaHours {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface PatchMgmtConfig {
  patchSlaHours: PatchSlaHours;
  reviewCycleYears: number;
}

// ============================================================================
// Union type for all configs
// ============================================================================

export type PolicyConfigData =
  | CryptoPolicyConfig
  | AccessControlConfig
  | ProcurementConfig
  | SecureDevConfig
  | PatchMgmtConfig;

export type PolicyConfigMap = {
  crypto: CryptoPolicyConfig;
  access_control: AccessControlConfig;
  procurement: ProcurementConfig;
  secure_dev: SecureDevConfig;
  patch_mgmt: PatchMgmtConfig;
};

// ============================================================================
// Default factories — BSI/CIR sourced
// ============================================================================

/**
 * What BSI TR-02102 recommends, read in Version 2026-01 (TR-02102-1 of 23.01.2026, TR-02102-2 of
 * 27.01.2026). "approved" is recommended by the TR; the TR bans nothing, so "deprecated" and
 * "prohibited" are the company's own line below it. ChaCha20-Poly1305, Ed25519 and X25519 alone are
 * not in the TR (TR-1 §3.2: "keine dedizierten Stromchiffren"), so a policy cannot cite it for them.
 */
function getDefaultCrypto(locale: "en" | "de"): CryptoPolicyConfig {
  const words =
    locale === "de"
      ? {
          passwords: "Argon2id (für Passwörter)",
          padding: "RSA mit PKCS#1-v1.5-Padding",
          hybrid: "ML-KEM-768 zusammen mit ECDHE",
        }
      : {
          passwords: "Argon2id (for passwords)",
          padding: "RSA with PKCS#1 v1.5 padding",
          hybrid: "ML-KEM-768 together with ECDHE",
        };
  return {
    algorithms: [
      // Symmetric: TR-1 Tab. 3.1 and 3.2 (AES with GCM; 256-bit keys for long-term protection)
      {
        category: "symmetric",
        algorithm: "AES-256-GCM",
        keyLength: "256",
        status: "approved",
      },
      {
        category: "symmetric",
        algorithm: "AES-128-GCM",
        keyLength: "128",
        status: "approved",
      },
      { category: "symmetric", algorithm: "DES", keyLength: "56", status: "prohibited" },
      {
        category: "symmetric",
        algorithm: "3DES",
        keyLength: "168",
        status: "prohibited",
      },
      { category: "symmetric", algorithm: "RC4", status: "prohibited" },
      // Hash: TR-1 Tab. 4.1; SHA-1 "sollte daher niemals ... verwendet werden" (Bem. 4.2)
      { category: "hash", algorithm: "SHA-256", status: "approved" },
      { category: "hash", algorithm: "SHA-384", status: "approved" },
      { category: "hash", algorithm: "SHA-512", status: "approved" },
      { category: "hash", algorithm: "SHA3-256", status: "approved" },
      // Passwords: TR-1 B.1.2
      { category: "hash", algorithm: words.passwords, status: "approved" },
      { category: "hash", algorithm: "MD5", status: "prohibited" },
      { category: "hash", algorithm: "SHA-1", status: "prohibited" },
      // Asymmetric: RSA modulus at least 3000 bits (TR-1 §5.3.1) with PSS or OAEP; PKCS#1 v1.5
      // is not recommended (TR-1 §1.5). Brainpool curves first, NIST curves where those are
      // unavailable (TR-1 Tab. B.3, TR-2 §3.6.2).
      {
        category: "asymmetric",
        algorithm: "RSA-PSS / RSA-OAEP",
        keyLength: "3072+",
        status: "approved",
      },
      {
        category: "asymmetric",
        algorithm: "ECDSA brainpoolP256r1",
        keyLength: "256",
        status: "approved",
      },
      {
        category: "asymmetric",
        algorithm: "ECDSA brainpoolP384r1",
        keyLength: "384",
        status: "approved",
      },
      {
        category: "asymmetric",
        algorithm: "ECDSA P-256",
        keyLength: "256",
        status: "approved",
      },
      {
        category: "asymmetric",
        algorithm: "ECDSA P-384",
        keyLength: "384",
        status: "approved",
      },
      { category: "asymmetric", algorithm: words.padding, status: "deprecated" },
      {
        category: "asymmetric",
        algorithm: "RSA",
        keyLength: "2048-2999",
        status: "deprecated",
      },
      {
        category: "asymmetric",
        algorithm: "RSA",
        keyLength: "<2048",
        status: "prohibited",
      },
      // Key exchange: ECDHE alone until the end of 2031 (TR-2 Tab. 6 and 10); ML-KEM used
      // together with it (TR-1 Tab. 2.7, §2.2)
      {
        category: "key_exchange",
        algorithm: "ECDHE brainpoolP256r1",
        status: "approved",
      },
      {
        category: "key_exchange",
        algorithm: "ECDHE brainpoolP384r1",
        status: "approved",
      },
      { category: "key_exchange", algorithm: "ECDHE P-256", status: "approved" },
      { category: "key_exchange", algorithm: "ECDHE P-384", status: "approved" },
      { category: "key_exchange", algorithm: words.hybrid, status: "approved" },
      // TLS 1.3 suites (TR-2 Tab. 13) and TLS 1.2 with forward secrecy until 2031 (TR-2 Tab. 3)
      { category: "tls", algorithm: "TLS_AES_256_GCM_SHA384", status: "approved" },
      { category: "tls", algorithm: "TLS_AES_128_GCM_SHA256", status: "approved" },
      { category: "tls", algorithm: "TLS_AES_128_CCM_SHA256", status: "approved" },
      {
        category: "tls",
        algorithm: "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
        status: "approved",
      },
      {
        category: "tls",
        algorithm: "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
        status: "approved",
      },
      {
        category: "tls",
        algorithm: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
        status: "approved",
      },
      {
        category: "tls",
        algorithm: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
        status: "approved",
      },
    ],
    // TLS 1.2 is recommended only until the end of 2031; TLS 1.3 should be preferred (TR-2 Tab. 2)
    minTlsVersion: "tls_1_2",
    keyRotationFrequencyYears: 1,
    triggerRotationOnCompromise: true,
    // CON.1.A15 (S): "mindestens jährlich … überprüfen, ob die eingesetzten kryptografischen Verfahren … noch ausreichend sicher sind"
    reviewCycleYears: 1,
    postQuantumReadiness: false,
  };
}

function getDefaultAccessControl(locale: "en" | "de"): AccessControlConfig {
  return {
    model: "rbac", // ORP.4.A5
    reviewFrequency: {
      standard: locale === "de" ? "jährlich" : "annual", // ORP.4.A4
      privileged: locale === "de" ? "vierteljährlich" : "quarterly", // ORP.4.A4 SOLLTE
    },
    deprovisioningSlaHours: 24, // ORP.4.A6
    sharedAccountPolicy: "prohibited", // ORP.4.A3 MUSS — unique IDs
    authReviewCycleYears: 2, // CIR 11.6.4
  };
}

function getDefaultProcurement(locale: "en" | "de"): ProcurementConfig {
  return {
    thresholdEur: 10000,
    requiredClauses: {
      cybersecurityRequirements: true,
      trainingCertification: true,
      backgroundChecks: true,
      incidentNotification: true,
      auditRights: true,
      vulnerabilityDisclosure: true,
      subcontractorFlowdown: true,
      secureDecommissioning: true,
    },
    customClauses: [],
    evaluationCriteria:
      locale === "de"
        ? [
            { criterion: "ISO 27001 oder gleichwertige Zertifizierung", weight: 30 },
            { criterion: "Incident-Response-Fähigkeiten", weight: 25 },
            { criterion: "Datenschutz und DSGVO-Konformität", weight: 20 },
            { criterion: "Patch-Management und Schwachstellenbehebung", weight: 15 },
            { criterion: "Unterauftragnehmer-Risikomanagement", weight: 10 },
          ]
        : [
            { criterion: "ISO 27001 or equivalent certification", weight: 30 },
            { criterion: "Incident response capabilities", weight: 25 },
            { criterion: "Data protection and GDPR compliance", weight: 20 },
            { criterion: "Patch management and vulnerability remediation", weight: 15 },
            { criterion: "Subcontractor risk management", weight: 10 },
          ],
    reviewFrequency: locale === "de" ? "jährlich" : "annual",
  };
}

function getDefaultSecureDev(_locale: "en" | "de"): SecureDevConfig {
  return {
    sdlcFramework: "owasp_samm",
    hardeningBaseline: "cis",
    testingRequirements: {
      sast: true,
      dast: true,
      sca: true,
      pentest: true,
      codeReview: true,
    },
    environmentSegregation: true,
    // BSI 200-2: "Für den überwiegenden Teil der Dokumente hat sich eine jährliche Überprüfung bewährt."
    reviewCycleYears: 1,
  };
}

function getDefaultPatchMgmt(_locale: "en" | "de"): PatchMgmtConfig {
  return {
    patchSlaHours: {
      critical: 24,
      high: 168,
      medium: 720,
      low: 2160,
    },
    // BSI 200-2: "Für den überwiegenden Teil der Dokumente hat sich eine jährliche Überprüfung bewährt."
    reviewCycleYears: 1,
  };
}

// ============================================================================
// Factory
// ============================================================================

export function getDefaultPolicyConfig<T extends PolicyType>(
  policyType: T,
  locale: "en" | "de" = "en",
): PolicyConfigMap[T] {
  const factories: Record<PolicyType, (l: "en" | "de") => PolicyConfigData> = {
    crypto: getDefaultCrypto,
    access_control: getDefaultAccessControl,
    procurement: getDefaultProcurement,
    secure_dev: getDefaultSecureDev,
    patch_mgmt: getDefaultPatchMgmt,
  };
  return factories[policyType](locale) as PolicyConfigMap[T];
}
