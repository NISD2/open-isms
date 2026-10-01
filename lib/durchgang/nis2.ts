/**
 * The NIS 2 Durchgang: which screens each item shows, in which order. Data only.
 *
 * The walk follows the journey order (`JOURNEY_ORDER`), so the order of this list does not
 * matter. It walks the front of that order, less the items in `NOT_WALKED`; an item is added here
 * only together with its reviewed copy in messages/durchgang.
 */

import type { CategoryCode } from "@/lib/compliance/category-schemas";
import type { AnyItem, Item } from "./types";

const item = <C extends CategoryCode>(i: Item<C>): Item<C> => i;

/**
 * Items at the front of the journey the walk leaves out, each with the reason. The requirement
 * page keeps them.
 */
export const NOT_WALKED: Readonly<Record<string, string>> = {
  "12.1":
    "Whoever reaches the Durchgang already knows their entity type; the walk does not decide it for them.",
  "1.3":
    "No statute asks for a separately approved security budget: § 30 and § 38 BSIG ask management to implement and oversee the measures. The nearest rule, CIR 2024/2690 Annex 1.1.1(e), binds only the digital providers the CIR covers and asks for a commitment to provide resources inside the security policy; the Leitlinie (2.4) carries that commitment for everyone.",
  "1.4":
    "No statute asks management to sign an acknowledgement of liability; § 38 Abs. 2 BSIG sets the liability itself, which the CEO course behind 1.1 teaches. The acknowledgement is a platform record, so it stays on the requirement page.",
  "5.3":
    "§ 30 Abs. 2 Nr. 4 BSIG sets no review cycle for suppliers. What every entity owes is to weigh each direct supplier's specific vulnerabilities and the quality of its products and security practice when it chooses the measures (Art. 21(3) NIS 2, carried into § 30 by the Begründung, BT-Drs. 21/1501 p. 148): 2.3 rates each supplier, and 5.2 records the agreements beside that rating. Monitoring and reviewing suppliers at planned intervals is CIR 2024/2690 Annex 5.1.6 and 5.1.7, which binds only the digital providers the CIR covers. The supplier risk register stays on the requirement page.",
  "5.4":
    "Whether a supplier must report incidents to the company is one of the two points 5.2 records per supplier, where the Begründung to § 30 BSIG puts it (agreements on handling cyber incidents, BT-Drs. 21/1501 p. 148). No statute sets a notification deadline in hours; CIR 2024/2690 Annex 5.1.4(d), which binds only the digital providers it covers, says 'without undue delay'. The requirement page keeps the field.",
  "3.2":
    "Telling an incident from a disruption, and deciding whether to report it, is written into the 3.1 plan (whoever notices calls the IT emergency number, the lead decides), and 3.3 explains when an incident is significant, which § 2 Nr. 11 BSIG defines itself. Classification schemes, detection tooling, logging and the quarterly check for recurring incidents are CIR 2024/2690 Annex 3.2 to 3.4 and Art. 4, which bind only the digital providers the CIR covers; attack detection systems are a duty of operators of critical facilities only (§ 31 Abs. 2 BSIG). The incident register fills when an incident happens.",
  "3.5":
    "No statute asks for a named review owner or for customer messages written in advance. After a significant incident the final report states the cause and the measures taken (§ 32 Abs. 1 Nr. 4 BSIG), which 3.3 shows, and the 3.1 plan commits to reviewing each incident and offers informing customers as a clause. In Germany, telling the recipients of a service is a duty only when the BSI orders it (§ 35 Abs. 1 BSIG) or for the sectors § 35 Abs. 2 lists. Post-incident reviews are CIR 2024/2690 Annex 3.6, which binds only the digital providers the CIR covers.",
  "9.2":
    "Recording, per asset, the type and strength of encryption for data at rest and in transit is CIR 2024/2690 Annex 9.2(a), which binds only the digital providers the CIR covers; the BSI's Krypto-Kataster (IT-Grundschutz CON.1.A19) is a recommendation. § 30 Abs. 2 Nr. 8 BSIG asks for Konzepte und Prozesse, and the 9.1 Kryptokonzept says where the company encrypts, as clauses the person chooses. The per-asset table stays on the requirement page.",
  "9.3":
    "Key-management methods are CIR 2024/2690 Annex 9.2(c), which binds only the digital providers the CIR covers. The process § 30 Abs. 2 Nr. 8 BSIG asks for includes how keys and certificates are kept, renewed and replaced, and the 9.1 Kryptokonzept carries that as a fixed section. A key vault, a monitoring tool and an alert threshold in days are tooling no statute names, so the requirement page keeps those fields.",
  "10.2":
    "A register of the access rights granted is CIR 2024/2690 Annex 11.2.2(e), and the rules for privileged accounts are Annex 11.3; both bind only the digital providers the CIR covers. § 30 Abs. 2 Nr. 9 BSIG asks for a Konzept for access control, which 10.1 writes. The owner, access method and number of administrator accounts per asset stay on the requirement page.",
  "10.3":
    "Sicherheit des Personals (§ 30 Abs. 2 Nr. 9 BSIG) is part of the 10.1 Konzept: joining, changing role and leaving, and outside staff. Background checks are CIR 2024/2690 Annex 10.2 and the management of privileged accounts Annex 11.3, which bind only the digital providers the CIR covers; the names of a joiner-mover-leaver tool and a privileged-access tool are tooling no statute asks for. The requirement page keeps those fields.",
  "10.4":
    "No statute sets when access rights are reviewed: CIR 2024/2690 Annex 11.2.3 and 11.3.3 say 'at planned intervals' and bind only the digital providers the CIR covers. The 10.1 Konzept offers the review as a clause (yearly, administrator accounts quarterly, from the values the BSI suggests in Grundschutz++ BER.4.4). A review is a dated proof that cannot exist on the day the walk runs, so the requirement page records each one when it happens.",
  "11.3":
    "Changing credentials, blocking after failed sign-ins and ending inactive sessions are CIR 2024/2690 Annex 11.6.2(c) to (e), which binds only the digital providers the CIR covers; no statute and no CIR point sets a password length, and NIST SP 800-63B is a US standard. § 30 Abs. 2 Nr. 10 BSIG names multi-factor or continuous authentication, which 11.1 walks. The BSI's password rules (IT-Grundschutz ORP.4.A8) are a clause of the 10.1 Konzept, and the requirement page keeps the fields.",
  "6.1":
    "Security when buying IT is the 'Beim Kauf' section of the rules 6.3 writes, where § 30 Abs. 2 Nr. 5 BSIG names it together with development, maintenance and vulnerabilities. The editor's threshold, eight contract clauses and weighted criteria are CIR 2024/2690 detail (Annex 5.1.4 and 6.1) for the digital providers the CIR covers, with defaults no source sets; the requirement page keeps them.",
  "6.2":
    "Development applies only to a company that develops software or has it developed, so the rules 6.3 writes offer it as a clause, and secure set-up (changing default passwords, switching off what is not needed) is a section and a clause there too. The editor's framework, hardening baseline and test types are CIR 2024/2690 Annex 6.2, 6.3 and 6.5 detail for the digital providers the CIR covers; the requirement page keeps them.",
  "6.4":
    "Installing security updates is the 'Updates' section of the rules 6.3 writes, where § 30 Abs. 2 Nr. 5 BSIG puts maintenance together with vulnerability management. No statute sets patch deadlines; CIR 2024/2690 Annex 6.6 asks the digital providers it covers for 'a reasonable time' without a number, and the BSI recommends installing security updates automatically (Grundschutz++ KONF.8.1.1). The deadlines per severity and the patch register stay on the requirement page.",
  "6.5":
    "§ 30 Abs. 2 Nr. 5 BSIG and Art. 21(2)(e) NIS 2 name maintenance, not a change procedure; change management is CIR 2024/2690 Annex 6.4, for the digital providers the CIR covers. The BSI reads maintenance to include planned, documented changes (NIS-2 Infopaket on security measures), so the rules 6.3 writes offer that as a clause, and the change register stays on the requirement page.",
};

export const NIS2_SCRIPT: readonly AnyItem[] = [
  item({
    code: "1.1",
    category: "GOV",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn", link: "ceo_course" },
      { kind: "sample", id: "record" },
      { kind: "register", id: "trainings", module: "training_record" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      managementTrainingProvider:
        "The walk records one training record per member of management, each with its provider; a single provider field on the intake cannot hold several.",
      lastManagementTraining:
        "The walk records one training record per member of management, each with its date; a single date on the intake cannot hold several.",
    },
  }),
  item({
    code: "5.1",
    category: "SUP",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "sample", id: "list" },
      { kind: "sources", id: "sources", sources: ["payables", "contracts", "provider"] },
      { kind: "register", id: "suppliers", module: "supplier" },
      { kind: "fields", id: "dependence", fields: ["singlePointOfFailureCount"] },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "5.2",
    category: "SUP",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "sources", id: "sources", sources: ["contracts", "dpa", "terms"] },
      { kind: "sample", id: "clause" },
      { kind: "agreements", id: "contracts" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "12.3",
    category: "REG",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "prepare", id: "changes" },
      {
        kind: "fields",
        id: "contact",
        fields: ["contactPersonName", "contactPersonEmail", "lastRegistrationUpdate"],
      },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      nextRegistrationUpdate:
        "§ 33 Abs. 5 BSIG sets no schedule, only 'unverzüglich, spätestens binnen zwei Wochen' after a change, so the Durchgang asks for no next date; the framework dropped the annual cadence for 12.3 for the same reason.",
    },
  }),
  item({
    code: "1.2",
    category: "GOV",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "register", id: "roles", module: "team" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "3.1",
    category: "INC",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn", link: "bsi_it_notfallkarte" },
      { kind: "fields", id: "lead", fields: ["incidentLead"] },
      {
        kind: "fields",
        id: "escalation",
        fields: ["itEmergencyNumber", "incidentEscalationContacts"],
      },
      { kind: "compare", id: "second_way" },
      { kind: "fields", id: "channel", fields: ["secureCommsChannel"] },
      { kind: "policy", id: "plan", policy: "incident_response" },
      {
        kind: "fields",
        id: "signed",
        fields: ["incidentPlanVersion", "incidentPlanApprovalDate"],
        approves: {
          version: "incidentPlanVersion",
          date: "incidentPlanApprovalDate",
        },
      },
      { kind: "evidence", id: "proof", field: null },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      irtTeamSize:
        "§ 30 Abs. 2 Nr. 2 BSIG and Art. 21(2)(b) NIS 2 require incident handling, not a team of a size; CIR 3.1.1 asks its digital providers for roles, not a headcount. A small company may handle incidents with one person.",
    },
  }),
  item({
    code: "3.3",
    category: "INC",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "provision", id: "clock", provision: "bsig_32_clock" },
      { kind: "sample", id: "first_report" },
      { kind: "prepare", id: "ready" },
      { kind: "fields", id: "setup", fields: ["bsiReportingRegistered"] },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      earlyWarningSlaHours:
        "The law sets the deadline itself, 24 hours from becoming aware (§ 32 Abs. 1 Nr. 1 BSIG, Art. 23(4)(a) NIS 2); an internal target shorter than that is good practice, not a duty, so the walk does not ask for one.",
    },
  }),
  item({
    code: "12.2",
    category: "REG",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "provision", id: "where", provision: "registration_portals" },
      {
        kind: "fields",
        id: "confirmation",
        fields: ["mukAccountId", "bsiRegistrationDate"],
      },
      { kind: "evidence", id: "proof", field: "registrationProofUploaded" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "2.1",
    category: "RSK",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "provision", id: "matrix", provision: "bsi_200_3_matrix" },
      {
        kind: "reading",
        id: "reading",
        examples: [
          { frequency: "frequent", impact: "negligible" },
          { frequency: "frequent", impact: "limited" },
          { frequency: "rare", impact: "existential" },
          { frequency: "frequent", impact: "considerable" },
          { frequency: "medium", impact: "existential" },
          { frequency: "very_frequent", impact: "considerable" },
        ],
      },
      { kind: "adopt", id: "adopt", adopts: "bsi_200_3_method" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "2.2",
    category: "RSK",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "sample", id: "list" },
      { kind: "sources", id: "sources", sources: ["ropa", "ledger", "provider"] },
      { kind: "assets", id: "processes", groups: ["business-processes"] },
      {
        kind: "assets",
        id: "business_apps",
        groups: ["customer-facing", "sales", "customer-service", "hr-payroll", "finance"],
      },
      {
        kind: "assets",
        id: "shared_apps",
        groups: ["it-applications", "sector-specific"],
      },
      {
        kind: "assets",
        id: "technology",
        groups: ["it-infrastructure", "endpoints", "network", "locations"],
      },
      { kind: "specify", id: "which_software", slice: "software" },
      { kind: "specify", id: "which_technology", slice: "technology" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      classificationLevels:
        "Protection levels (Schutzbedarf normal, hoch, sehr hoch) are the BSI 200-2 method; neither § 30 BSIG nor Art. 21 NIS 2 asks for them, and a small company rates each asset on its own before choosing a scale.",
    },
  }),
  item({
    code: "2.3",
    category: "RSK",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "rate", id: "software", targets: "software" },
      { kind: "rate", id: "technology", targets: "technology" },
      { kind: "rate", id: "suppliers", targets: "suppliers" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "2.4",
    category: "RSK",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "policy", id: "leitlinie", policy: "information_security" },
      {
        kind: "fields",
        id: "signed",
        fields: ["policyVersion", "policyApprovalDate"],
        approves: {
          version: "policyVersion",
          date: "policyApprovalDate",
        },
      },
      { kind: "evidence", id: "proof", field: null },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      residualRiskCount:
        "Documenting why residual risks are accepted is CIR 2024/2690 Annex 2.1.2(j), which binds only the digital providers the CIR covers; neither § 30 BSIG nor Art. 21 NIS 2 asks for it. 2.3 proposes a treatment for each rated risk, and the requirement page keeps the acceptance.",
    },
  }),
  item({
    code: "9.1",
    category: "CRY",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn", link: "bsi_tr_02102" },
      { kind: "policy", id: "konzept", policy: "cryptography" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "10.1",
    category: "ACC",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "leaver" },
      { kind: "policy", id: "konzept", policy: "personnel_access" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "11.1",
    category: "AUT",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "where_first" },
      { kind: "logins", id: "logins" },
      { kind: "fields", id: "tool", fields: ["mfaTool"] },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      mfaMethods:
        "§ 30 Abs. 2 Nr. 10 BSIG asks for multi-factor solutions, not a method; the BSI states that the German act sets no assurance level and the entity chooses from its risk analysis (#nis2know MFA page). The tool's name records what is used.",
      mfaCoverage:
        "Where a second factor is on is marked per program and remote access on the list from 2.2; one scope choice on top would state the same fact twice.",
      mfaCoveragePct:
        "A percentage is a progress figure no statute asks for, and it follows from the marks per program.",
      adminMfaEnforced:
        "A second factor for privileged accounts is CIR 2024/2690 Annex 11.3.2(a), which binds only the digital providers the CIR covers; the BSI recommends it (Grundschutz++ BER.5.9, IT-Grundschutz ORP.4.A10). The 10.1 Konzept offers it as a clause.",
    },
  }),
  item({
    code: "11.2",
    category: "AUT",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "answer" },
      { kind: "fields", id: "tools", fields: ["secureCommsTools"] },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      emergencyCommsChannel:
        "The way to reach each other when the company's IT fails is asked in 3.1 (secureCommsChannel) and written into the incident plan; asking the same fact twice would let the answers drift apart.",
      lastEmergencyCommsTest:
        "No statute sets a test of the emergency channel; the 3.1 plan offers a yearly run-through of the plan as a clause.",
    },
  }),
  item({
    code: "6.3",
    category: "PRO",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "updates" },
      { kind: "prepare", id: "sources" },
      { kind: "fields", id: "report", fields: ["vulnerabilityDisclosureUrl"] },
      { kind: "policy", id: "rules", policy: "it_rules" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      vulnerabilityScanningFrequency:
        "Scans are CIR 2024/2690 Annex 6.10.2(b), 'where appropriate', for the digital providers the CIR covers, and a BSI recommendation (NIS-2 Infopaket on security measures); no statute sets a scan rhythm. The rules 6.3 writes offer regular checks as a clause.",
      vulnerabilityScanTool:
        "The tool follows from a scan rhythm no statute sets (CIR 2024/2690 Annex 6.10.2(b)); the requirement page keeps it.",
      lastPentestDate:
        "Penetration tests are not named in § 30 BSIG or Art. 21 NIS 2; security testing is CIR 2024/2690 Annex 6.5, for the digital providers the CIR covers.",
    },
  }),
];
