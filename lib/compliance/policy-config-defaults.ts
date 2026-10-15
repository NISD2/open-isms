/**
 * Policy Config Defaults — BSI/CIR-sourced defaults for structured policy editors
 *
 * Each policy type has a locale-aware factory. Config is stored as JSONB; its types are inferred
 * from the Zod schemas in policy-config-schemas.ts, the one place its shape is written.
 */

import type { PolicyConfigMap } from "./policy-config-schemas";

export type { PolicyConfigMap } from "./policy-config-schemas";

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
// Config types, inferred from policy-config-schemas.ts
// ============================================================================

export type CryptoPolicyConfig = PolicyConfigMap["crypto"];
export type CryptoAlgorithmEntry = CryptoPolicyConfig["algorithms"][number];
export type AccessControlConfig = PolicyConfigMap["access_control"];
export type ProcurementConfig = PolicyConfigMap["procurement"];
export type ProcurementEvalCriterion = ProcurementConfig["evaluationCriteria"][number];
export type ProcurementCustomClause = ProcurementConfig["customClauses"][number];
export type SecureDevConfig = PolicyConfigMap["secure_dev"];
export type PatchMgmtConfig = PolicyConfigMap["patch_mgmt"];
export type PatchSlaHours = PatchMgmtConfig["patchSlaHours"];
export type PolicyConfigData = PolicyConfigMap[PolicyType];

/**
 * The languages defaults are written in. Czech exists for the crypto list, the one default the
 * Czech walk writes; the other editors' words read English in Czech.
 */
type DefaultsLocale = "en" | "de" | "cs";

// ============================================================================
// Default factories — BSI/CIR sourced
// ============================================================================

/**
 * What BSI TR-02102 recommends, read in Version 2026-01 (TR-02102-1 of 23.01.2026, TR-02102-2 of
 * 27.01.2026). "approved" is recommended by the TR; the TR bans nothing, so "deprecated" and
 * "prohibited" are the company's own line below it. ChaCha20-Poly1305, Ed25519 and X25519 alone are
 * not in the TR (TR-1 §3.2: "keine dedizierten Stromchiffren"), so a policy cannot cite it for them.
 */
const CRYPTO_WORDS: Readonly<
  Record<"de" | "en", { passwords: string; padding: string; hybrid: string }>
> = {
  de: {
    passwords: "Argon2id (für Passwörter)",
    padding: "RSA mit PKCS#1-v1.5-Padding",
    hybrid: "ML-KEM-768 zusammen mit ECDHE",
  },
  en: {
    passwords: "Argon2id (for passwords)",
    padding: "RSA with PKCS#1 v1.5 padding",
    hybrid: "ML-KEM-768 together with ECDHE",
  },
};

const tr02102Algorithms = (
  words: (typeof CRYPTO_WORDS)["de"],
): CryptoAlgorithmEntry[] => [
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
];

const approved = (
  category: CryptoAlgorithmEntry["category"],
  algorithm: string,
  keyLength?: string,
): CryptoAlgorithmEntry =>
  keyLength
    ? { category, algorithm, keyLength, status: "approved" }
    : { category, algorithm, status: "approved" };

/**
 * NÚKIB, „Minimální požadavky na kryptografické algoritmy“, verze 4.1 ze 4. března 2026
 * (https://portal.nukib.gov.cz/informacni-servis/podpurne-materialy/69a82264c32c1c948f0686a4),
 * which both Czech decrees require a company to take into account (410 § 13 odst. 1 písm. c),
 * 409 § 25 odst. 1 písm. c)). Each "approved" entry is a numbered item of the document, cited
 * below as chapter, letter and item. The document lists only what NÚKIB approves and gives no
 * transition period, so nothing is "deprecated": what the German list bans or keeps only for what
 * exists, NÚKIB does not approve either, and is "prohibited" here. Kyber is left out, as 4 b)
 * prefers ML-KEM and expects to approve only it; so is Falcon, whose variants 4 e) has yet to set.
 */
const nukibAlgorithms = (): CryptoAlgorithmEntry[] => [
  // 2 a) 1.-4. block ciphers
  approved("symmetric", "AES", "128, 192 nebo 256"),
  approved("symmetric", "Twofish", "128–256"),
  approved("symmetric", "Camellia", "128, 192 nebo 256"),
  approved("symmetric", "Serpent", "128, 192 nebo 256"),
  // 2 b) 1.-2. stream ciphers
  approved("symmetric", "SNOW 2.0", "128 nebo 256"),
  approved("symmetric", "SNOW 3G", "128 nebo 256"),
  approved("symmetric", "ChaCha20 se zatížením klíče menším než 256 GB", "256"),
  // 2 c) 1.-6. authenticated encryption; 2 d) 1.-4. the modes Encrypt-then-MAC may encrypt with
  approved("symmetric", "CCM"),
  approved("symmetric", "EAX"),
  approved("symmetric", "OCB3"),
  approved("symmetric", "OCB1"),
  approved("symmetric", "GCM s 96bitovým inicializačním vektorem a 128bitovým tagem"),
  approved("symmetric", "ChaCha20 + Poly1305 se zatížením klíče menším než 256 GB"),
  approved("symmetric", "Encrypt-then-MAC s módem CTR/OFB/CBC/CBC-CS/CFB"),
  // 2 e) 1.-6. message authentication; EMAC and UMAC may be removed later (footnote 2)
  approved("symmetric", "HMAC se schválenou hašovací funkcí"),
  approved("symmetric", "CMAC"),
  approved("symmetric", "KMAC"),
  approved("symmetric", "GMAC s 96bitovým inicializačním vektorem a 128bitovým tagem"),
  approved("symmetric", "EMAC"),
  approved("symmetric", "UMAC"),
  // 2 f) 1.-2. disk encryption
  approved("symmetric", "XTS pro šifrování disků (sektor nejvýše 2²⁰ bloků)"),
  approved("symmetric", "EME2 pro šifrování disků"),
  // Not on the lists in 2 a) and b); 2 d): „Samostatné použití módů šifrování mimo schémata typu
  // „Encrypt-then-MAC“ není schváleno.“
  { category: "symmetric", algorithm: "DES", keyLength: "56", status: "prohibited" },
  { category: "symmetric", algorithm: "3DES", keyLength: "168", status: "prohibited" },
  { category: "symmetric", algorithm: "RC4", status: "prohibited" },
  {
    category: "symmetric",
    algorithm: "CTR/OFB/CBC/CFB samostatně mimo Encrypt-then-MAC",
    status: "prohibited",
  },
  // 5 a) 1.-4., b) 1.-5., c) 1.-2.; every hash function at least 256 bits of output (5, Upozornění)
  approved("hash", "SHA-256"),
  approved("hash", "SHA-384"),
  approved("hash", "SHA-512"),
  approved("hash", "SHA-512/256"),
  approved("hash", "SHA3-256"),
  approved("hash", "SHA3-384"),
  approved("hash", "SHA3-512"),
  approved("hash", "SHAKE128 s výstupem alespoň 256 bitů"),
  approved("hash", "SHAKE256 s výstupem alespoň 256 bitů"),
  approved("hash", "Whirlpool"),
  approved("hash", "BLAKE2 s výstupem alespoň 256 bitů"),
  // 6 1.-3. password storage
  approved("hash", "Argon2id pro hesla (alespoň t = 1, m = 2 GiB, p = 4)"),
  approved(
    "hash",
    "Argon2id pro hesla při omezené paměti (alespoň t = 3, m = 64 MiB, p = 4)",
  ),
  approved("hash", "scrypt pro hesla (alespoň N = 131072, r = 8, p = 1)"),
  approved("hash", "PBKDF2 s HMAC-SHA-256 pro hesla (alespoň 600 000 iterací)"),
  approved("hash", "PBKDF2 s HMAC-SHA-512 pro hesla (alespoň 210 000 iterací)"),
  // MD5 (128 bits) and SHA-1 (160 bits) fall below the 256 bits of output in 5, Upozornění
  { category: "hash", algorithm: "MD5", status: "prohibited" },
  { category: "hash", algorithm: "SHA-1", status: "prohibited" },
  // 3 a) 1.-4. classical signatures
  approved("asymmetric", "DSA s cyklickou podgrupou alespoň 256 bitů", "3072 a více"),
  approved("asymmetric", "EC-DSA", "256 a více"),
  approved("asymmetric", "RSA-PSS", "3072 a více"),
  approved("asymmetric", "EC-Schnorr", "256 a více"),
  // 4 c) 1.-2., recommended only for firmware and software integrity; 4 d) 1.-2.; 4 e) 1.: in a
  // hybrid, ML-DSA-65 too
  approved("asymmetric", "LMS jen pro ochranu integrity firmwaru a softwaru"),
  approved("asymmetric", "XMSS jen pro ochranu integrity firmwaru a softwaru"),
  approved("asymmetric", "ML-DSA-87"),
  approved("asymmetric", "SLH-DSA s bezpečnostní úrovní NIST 3 nebo 5"),
  approved("asymmetric", "ML-DSA-65 hybridně se schváleným klasickým podpisem"),
  // RSA only as RSA-PSS, RSA-OAEP and RSA-KEM, each with 3072 bits and more (3 a) 3., b) 6.-7.)
  {
    category: "asymmetric",
    algorithm: "RSA s paddingem PKCS#1 v1.5",
    status: "prohibited",
  },
  {
    category: "asymmetric",
    algorithm: "RSA",
    keyLength: "méně než 3072",
    status: "prohibited",
  },
  // 3 b) 1.-7. classical key establishment; the document prints ECIES-KEM as "ECIESKEM"
  approved("key_exchange", "DH s cyklickou podgrupou alespoň 256 bitů", "3072 a více"),
  approved("key_exchange", "ECDH", "256 a více"),
  approved("key_exchange", "ECIES-KEM", "256 a více"),
  approved("key_exchange", "PSEC-KEM", "256 a více"),
  approved("key_exchange", "ACE-KEM", "256 a více"),
  approved("key_exchange", "RSA-OAEP", "3072 a více"),
  approved("key_exchange", "RSA-KEM", "3072 a více"),
  // 4 a) 1.; 4 b) 1.-3., each together with one of 3 b)
  approved("key_exchange", "ML-KEM-1024"),
  approved("key_exchange", "ML-KEM-768 hybridně se schváleným klasickým algoritmem"),
  approved(
    "key_exchange",
    "FrodoKEM-976/FrodoKEM-1344 hybridně se schváleným klasickým algoritmem",
  ),
  approved(
    "key_exchange",
    "mceliece460896/mceliece6688128/mceliece8192128 hybridně se schváleným klasickým algoritmem",
  ),
  approved(
    "key_exchange",
    "mceliece460896f/mceliece6688128f/mceliece8192128f hybridně se schváleným klasickým algoritmem",
  ),
  // The document names no TLS suites. These are the German ones whose every part is an item above:
  // AES (2 a) 1.), GCM (2 c) 4.) or CCM (2 c) 1.), SHA-256 or SHA-384 (5 a) 1.-2.), ephemeral
  // ECDH (3 b) 2.), EC-DSA (3 a) 2.). The ECDHE_RSA suites are left out: TLS 1.2 signs with RSA
  // PKCS#1 v1.5 unless RSA-PSS is negotiated, and 3 a) approves RSA signatures only as RSA-PSS.
  approved("tls", "TLS_AES_256_GCM_SHA384"),
  approved("tls", "TLS_AES_128_GCM_SHA256"),
  approved("tls", "TLS_AES_128_CCM_SHA256"),
  approved("tls", "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384"),
  approved("tls", "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256"),
];

/** The German and English lists follow the BSI; the Czech list follows NÚKIB. */
const CRYPTO_ALGORITHMS: Readonly<Record<DefaultsLocale, () => CryptoAlgorithmEntry[]>> =
  {
    de: () => tr02102Algorithms(CRYPTO_WORDS.de),
    en: () => tr02102Algorithms(CRYPTO_WORDS.en),
    cs: nukibAlgorithms,
  };

function getDefaultCrypto(locale: DefaultsLocale): CryptoPolicyConfig {
  return {
    algorithms: CRYPTO_ALGORITHMS[locale](),
    // TLS 1.2 is recommended only until the end of 2031; TLS 1.3 should be preferred (TR-2 Tab. 2).
    // NÚKIB's document sets no TLS version, so the Czech list keeps this floor; nor does it set
    // the rotation and review intervals below.
    minTlsVersion: "tls_1_2",
    keyRotationFrequencyYears: 1,
    triggerRotationOnCompromise: true,
    // CON.1.A15 (S): "mindestens jährlich … überprüfen, ob die eingesetzten kryptografischen Verfahren … noch ausreichend sicher sind"
    reviewCycleYears: 1,
    postQuantumReadiness: false,
  };
}

function getDefaultAccessControl(locale: DefaultsLocale): AccessControlConfig {
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

function getDefaultProcurement(locale: DefaultsLocale): ProcurementConfig {
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

function getDefaultSecureDev(_locale: DefaultsLocale): SecureDevConfig {
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

function getDefaultPatchMgmt(_locale: DefaultsLocale): PatchMgmtConfig {
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
  locale: DefaultsLocale = "en",
): PolicyConfigMap[T] {
  const factories: Record<PolicyType, (l: DefaultsLocale) => PolicyConfigData> = {
    crypto: getDefaultCrypto,
    access_control: getDefaultAccessControl,
    procurement: getDefaultProcurement,
    secure_dev: getDefaultSecureDev,
    patch_mgmt: getDefaultPatchMgmt,
  };
  return factories[policyType](locale) as PolicyConfigMap[T];
}
