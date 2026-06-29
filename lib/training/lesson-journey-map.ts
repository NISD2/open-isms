/**
 * Maps an nis2-ceo course lesson to the NIS2 journey category it leads to.
 *
 * Coarse by design: a lesson points at a category (e.g. "SUP"), never an exact
 * requirement code. This survives requirement renames and sidesteps the id
 * collision (lesson "2.1" is NOT requirement "2.1"). Overview lessons — the law
 * primer, scenarios with no single target, the insurance module, the closing
 * roadmap — are intentionally absent: we never fabricate a mapping.
 *
 * Single source of truth. The per-lesson link reads this; nothing else writes
 * lesson->journey wiring. No DB column, no schema change.
 */
export const LESSON_JOURNEY_CATEGORY: Record<string, string> = {
  // Module 1 — the law: only the lessons with a clean single target
  "1.3": "GOV", // Penalties and the manager ban -> governance accountability
  "1.4": "REG", // The registration obligation
  "1.5": "GOV", // Duty to approve and oversee
  "1.6": "TRN", // Your training duty
  "1.7": "GOV", // Personal liability
  "1.8": "GOV", // Business judgment rule
  "1.10": "RSK", // All-hazards approach and state of the art
  "1.11": "INC", // Reporting cascade and significant incidents
  "1.12": "INC", // Customer notification duty

  // Module 2 — risk foundation (2.1-2.6) + the ten measures (2.6-2.15, 1:1)
  "2.1": "RSK",
  "2.2": "RSK",
  "2.3": "RSK",
  "2.4": "RSK",
  "2.5": "RSK",
  "2.6": "RSK", // Measure 1 - risk analysis and infosec policies
  "2.7": "INC", // Measure 2 - incident handling
  "2.8": "BCP", // Measure 3 - business continuity
  "2.9": "SUP", // Measure 4 - supply chain security
  "2.10": "PRO", // Measure 5 - acquisition, development, maintenance
  "2.11": "EFF", // Measure 6 - effectiveness assessment
  "2.12": "TRN", // Measure 7 - cyber hygiene and training
  "2.13": "CRY", // Measure 8 - cryptography
  "2.14": "ACC", // Measure 9 - HR security, access control, asset management
  "2.15": "AUT", // Measure 10 - MFA and secured communications

  // Module 3 — decision support: governance practice + targeted scenarios
  "3.1": "GOV",
  "3.2": "GOV",
  "3.3": "GOV",
  "3.4": "GOV",
  "3.5": "GOV",
  "3.6": "GOV",
  "3.7": "EFF", // Regulator audit walkthrough
  "3.8": "INC", // Ransomware scenario
  "3.9": "SUP", // Supplier breach scenario
  "3.10": "INC", // Phishing: significant or not
  "3.11": "EFF", // Pre-audit gap discovery

  // Module 4 — protection: only the incident-response lessons (insurance has no target)
  "4.5": "INC", // First 48 hours of crisis communication
  "4.6": "INC", // Ransomware payment decisions
};

/**
 * Display name per NIS2 category code, for the in-lesson link label. MUST match
 * the journey section headers so the label and the landing section read the same:
 * EN mirrors nis2Categories[].name (grc-data-model/frameworks/nis2.ts), DE mirrors
 * CATEGORY_NAME_DE (journey/path-nodes.ts). Kept local to avoid coupling training
 * to journey internals; re-align here on any category rename.
 */
export const JOURNEY_CATEGORY_LABEL: Record<string, { en: string; de: string }> = {
  GOV: { en: "Governance", de: "Governance" },
  RSK: { en: "Risk Management", de: "Risikomanagement" },
  INC: { en: "Incident Handling", de: "Vorfallsbehandlung" },
  BCP: { en: "Business Continuity", de: "Geschäftskontinuität" },
  SUP: { en: "Suppliers and Supply Chain", de: "Lieferanten und Lieferkette" },
  PRO: { en: "Patching and Vulnerability", de: "Patches und Schwachstellen" },
  EFF: { en: "Effectiveness Review", de: "Wirksamkeitsprüfung" },
  TRN: { en: "Training", de: "Schulung" },
  CRY: { en: "Cryptography", de: "Kryptografie" },
  ACC: { en: "Access Control", de: "Zugriffssteuerung" },
  AUT: { en: "Authentication", de: "Authentifizierung" },
  REG: { en: "Registration", de: "Registrierung" },
};

export function journeyCategoryForLesson(lessonId: string): string | null {
  return LESSON_JOURNEY_CATEGORY[lessonId] ?? null;
}
