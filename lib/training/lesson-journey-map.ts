/**
 * Maps an nis2-ceo course lesson to the walk item where it is put into practice.
 *
 * Keys are lesson IDs, values walk item codes: lesson "2.1" is NOT requirement
 * "2.1", so every pair is written out and tested against the walk. Lessons with
 * no walk item are absent, and we never fabricate a mapping: the law primer,
 * penalties and liability (the walk leaves 1.4's acknowledgement out), roles and
 * reporting lines (it leaves 1.2 out), the insurance module and the closing
 * roadmap.
 *
 * Single source of truth. The per-lesson link into the walk reads this; nothing
 * else writes lesson->walk wiring. No DB column, no schema change.
 */
export const LESSON_WALK_ITEM: Readonly<Record<string, string>> = {
  // Module 1 — the law: only the lessons with a clean single target
  "1.4": "12.2", // The registration obligation
  "1.5": "7.3", // Duty to approve and oversee -> management approves
  "1.6": "1.1", // Your training duty -> management training
  "1.10": "2.1", // All-hazards approach and state of the art
  "1.11": "3.3", // Reporting cascade and significant incidents
  "1.12": "3.1", // Customer notification duty -> a clause of the incident plan

  // Module 2 — risk foundation (2.1-2.6) + the ten measures (2.6-2.15, 1:1)
  "2.1": "2.1",
  "2.2": "2.2", // What is an asset? -> the asset register
  "2.3": "2.1",
  "2.4": "2.1",
  "2.5": "2.1",
  "2.6": "2.1", // Measure 1 - risk analysis and infosec policies
  "2.7": "3.1", // Measure 2 - incident handling
  "2.8": "4.2", // Measure 3 - business continuity
  "2.9": "5.1", // Measure 4 - supply chain security
  "2.10": "6.3", // Measure 5 - acquisition, development, maintenance
  "2.11": "7.3", // Measure 6 - effectiveness assessment
  "2.12": "8.2", // Measure 7 - cyber hygiene and training
  "2.13": "9.1", // Measure 8 - cryptography
  "2.14": "10.1", // Measure 9 - HR security, access control, asset management
  "2.15": "11.1", // Measure 10 - MFA and secured communications

  // Module 3 — decision support: sign-off practice + targeted scenarios
  "3.2": "7.3", // Sign-off in practice
  "3.3": "7.3", // When to re-sign-off
  "3.4": "7.3", // Red flags in the sign-off process
  "3.5": "7.3", // What you cannot delegate
  "3.7": "7.3", // Regulator audit walkthrough
  "3.8": "3.1", // Ransomware scenario
  "3.9": "5.1", // Supplier breach scenario
  "3.10": "3.3", // Phishing: significant or not
  "3.11": "7.3", // Pre-audit gap discovery

  // Module 4 — protection: only the incident-response lessons (insurance has no target)
  "4.5": "3.1", // First 48 hours of crisis communication
  "4.6": "3.1", // Ransomware payment decisions
};

export function walkItemForLesson(lessonId: string): string | null {
  return LESSON_WALK_ITEM[lessonId] ?? null;
}

/**
 * Reverse direction: the one canonical CEO-course lesson that teaches each NIS2
 * category, for the "learn this in the course" link on compliance/journey
 * surfaces. The ten Article 21 measures map to their measure lesson (2.6-2.15);
 * GOV and REG use the foundational lesson. Distinct from LESSON_JOURNEY_CATEGORY
 * (which tags many lessons to a category); the planned cross-link registry will
 * unify both directions.
 */
export const CATEGORY_TEACHING_LESSON: Record<string, string> = {
  GOV: "1.5", // Your Duty to Approve and Oversee
  RSK: "2.6", // Measure 1 - Risk Analysis and Information Security Policies
  INC: "2.7", // Measure 2 - Incident Handling
  BCP: "2.8", // Measure 3 - Business Continuity
  SUP: "2.9", // Measure 4 - Supply Chain Security
  PRO: "2.10", // Measure 5 - Acquisition, Development, and Maintenance
  EFF: "2.11", // Measure 6 - Effectiveness Assessment
  TRN: "2.12", // Measure 7 - Cyber Hygiene and Training
  CRY: "2.13", // Measure 8 - Cryptography
  ACC: "2.14", // Measure 9 - HR Security, Access Control, and Asset Management
  AUT: "2.15", // Measure 10 - Multi-Factor Authentication and Secured Communications
  REG: "1.4", // The Registration Obligation
};

export function teachingLessonForCategory(categoryCode: string): string | null {
  return CATEGORY_TEACHING_LESSON[categoryCode] ?? null;
}
