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
  "1.2":
    "No statute asks every entity to name roles: § 38 Abs. 1 BSIG and Art. 20(1) NIS 2 have management implement and oversee the measures. Roles, responsibilities and authorities are CIR 2024/2690 Annex 1.2, which binds only the digital providers the CIR covers, and a security officer is BSI advice (BSI-Standard 200-2). The walk names the people it needs where it needs them: whoever leads in an emergency in 3.1, with an invite for someone not in the team yet, and management for the approval in 7.3. The requirement page keeps the team and its roles.",
  "1.3":
    "No statute asks for a separately approved security budget: § 30 and § 38 BSIG ask management to implement and oversee the measures. The nearest rule, CIR 2024/2690 Annex 1.1.1(e), binds only the digital providers the CIR covers and asks for a commitment to provide resources inside the security policy, which the Leitlinie (2.4) carries in its section on responsibility (management „stellt dafür Zeit, Geld und Personal bereit“). The requirement page keeps the budget fields.",
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
  "4.1":
    "No statute asks for a business impact analysis or for recovery time and point objectives: § 30 Abs. 2 Nr. 3 BSIG and Art. 21(2)(c) NIS 2 name Aufrechterhaltung des Betriebs, Backup-Management, Wiederherstellung nach einem Notfall and Krisenmanagement. The analysis is CIR 2024/2690 Annex 4.1.3, which binds only the digital providers the CIR covers, and BSI-Standard 200-4 recommends it. The plan 4.2 writes names what has to keep running and offers recovery targets as a clause; the requirement page keeps the analysis and its figures.",
  "4.3":
    "Recovery after an emergency is the Wiederherstellung section of the plan 4.2 writes, where § 30 Abs. 2 Nr. 3 BSIG names it together with continuity and crisis management. An order of recovery and recovery objectives per system are CIR 2024/2690 Annex 4.1.2(e) and (f), for the digital providers the CIR covers, and the BSI's guide for small companies places the Wiederanlaufplan from its Aufbau level on. The requirement page keeps each system's RTO and RPO.",
  "4.5":
    "No statute asks for a test of the continuity plan: § 30 Abs. 2 Nr. 3 BSIG names the measures, and Nr. 6 asks for procedures to assess effectiveness in general, which 7.x carries. Tests at planned intervals are CIR 2024/2690 Annex 4.1.4, 4.2.6 and 4.3.4, for the digital providers the CIR covers. The plan 4.2 writes offers a yearly exercise as a clause, after BSI-Standard 200-4, and the exercise register stays on the requirement page.",
  "8.1":
    "The Leitlinie is written in 2.4, and its last screen says to give it to every employee. No statute asks for a separate acceptable-use policy or for staff acknowledgements: those are CIR 2024/2690 Annex 1.1.1(f) and 1.2.2 for the digital providers the CIR covers, and announcing the Leitlinie to staff is BSI advice (IT-Grundschutz ISMS.1.A3). Telling staff the rules is an awareness measure under § 30 Abs. 2 Nr. 7 BSIG, recorded in 8.2.",
  "8.3":
    "§ 30 Abs. 2 Nr. 7 BSIG asks for 'grundlegende Schulungen und Sensibilisierungsmaßnahmen', not for training by role. Role-specific security training, including on a change of role, is CIR 2024/2690 Annex 8.2, which binds only the digital providers the CIR covers. Management training is § 38 Abs. 3 BSIG, walked in 1.1, and any other training can be recorded in 8.2.",
  "7.1":
    "Neither § 30 BSIG nor Art. 21 NIS 2 asks for security KPIs, a dashboard or a trend tool: § 30 Abs. 2 Nr. 6 asks for Konzepte und Verfahren zur Bewertung der Wirksamkeit. Indicators are CIR 2024/2690 Annex 1.1.1(j) and 7.2, which bind only the digital providers the CIR covers, and the BSI suggests them as advice. The procedure runs in the management review (7.3); the requirement page keeps the KPI register.",
  "7.2":
    "No statute asks every entity for internal audits. Independent reviews are CIR 2024/2690 Annex 2.3, which binds only the digital providers the CIR covers; audits every three years bind operators of critical facilities (§ 39 Abs. 1 BSIG), and the BSI may order audits of particularly important entities (§ 61 Abs. 1 BSIG). Regular reviews of effectiveness are BSI advice (IT-Grundschutz ISMS.1.A11). Effectiveness is checked in the management review (7.3); the requirement page keeps the audit plan.",
  "7.4":
    "Art. 21(4) NIS 2 asks that an entity that finds it does not comply takes corrective measures without undue delay; the BSIG has no separate sentence for it, and neither text asks for a register, a tool, counts or closure times. The measures management decides are recorded with the review in 7.3, and the improvement register stays on the requirement page.",
  "12.4":
    "The one duty here that binds every entity is to document compliance (§ 30 Abs. 1 S. 3 BSIG), and the Durchgang as a whole is that documentation: each item's records and documents, which management reviews and approves in 7.3. Attack detection and three-yearly evidence bind operators of critical facilities only (§ 31 Abs. 2, § 39 BSIG), so only a company whose profile says so walks 12.4, and the special registration binds only the § 60 Abs. 1 entity types (§ 34 BSIG). Handing documents over when the BSI asks follows from its supervisory powers (§ 61 Abs. 5, § 62 BSIG); a correspondence log and the BSI's information-sharing platform (§ 6 BSIG) are voluntary.",
  "3.4":
    "No statute requires an exercise. § 30 Abs. 2 Nr. 6 BSIG asks for concepts and procedures to assess whether the measures work, and an exercise is one way among others. Testing incident response at planned intervals is CIR 2024/2690 Annex 3.5.5 and 3.1.3, which bind only the digital providers the CIR covers. The 3.1 plan and the 4.2 plan each offer a yearly exercise as a clause.",
  "8.4":
    "No statute asks for phishing simulations or for testing training: CIR 2024/2690 Annex 8.1.3 and 8.2.3 ask the digital providers the CIR covers to test awareness and assess training, and the BSI names phishing-simulation results only as one example of an indicator. Whether awareness works can be raised in the management review (7.3); the requirement page keeps the simulation fields.",
};

/**
 * Where each item the walk leaves out is met: the walked items that carry the part of it every
 * entity owes, or `null` when no statute asks it of every entity. Checked against § 30, § 32, § 33
 * and § 38 BSIG and the walk's own copy (NIS2 reviews/legal/2026-10-03-walk-coverage-bsig.md).
 */
export const COVERED_BY: Readonly<Record<string, readonly string[] | null>> = {
  "12.1": null,
  "12.4": ["7.3"],
  "1.2": null,
  "1.3": null,
  "1.4": null,
  "5.3": ["2.3", "5.2"],
  "5.4": ["5.2"],
  "3.2": ["3.1", "3.3"],
  "3.4": ["3.1", "4.2"],
  "3.5": ["3.1", "3.3"],
  "9.2": ["9.1"],
  "9.3": ["9.1"],
  "10.2": ["10.1"],
  "10.3": ["10.1"],
  "10.4": ["10.1"],
  "11.3": ["11.1", "10.1"],
  "6.1": ["6.3"],
  "6.2": ["6.3"],
  "6.4": ["6.3"],
  "6.5": ["6.3"],
  "4.1": ["4.2"],
  "4.3": ["4.2"],
  "4.5": ["4.2"],
  "8.1": ["2.4", "8.2"],
  "8.3": ["1.1", "8.2"],
  "8.4": null,
  "7.1": ["7.3", "2.4"],
  "7.2": ["7.3", "2.4"],
  "7.4": ["7.3"],
};

export const NIS2_SCRIPT: readonly AnyItem[] = [
  item({
    code: "1.1",
    category: "GOV",
    law: { bsig: 38, article: 20 },
    mustDo:
      "§ 38 Abs. 3 BSIG: management „muss“ take part in training regularly; the provision leaves no proportionality to weigh.",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn", link: "ceo_course" },
      { kind: "sample", id: "record" },
      {
        kind: "register",
        id: "trainings",
        module: "training_record",
        audience: "management",
      },
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
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "sample", id: "list" },
      { kind: "prepare", id: "ready", confirm: true },
      { kind: "register", id: "suppliers", module: "supplier" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      singlePointOfFailureCount:
        "No statute asks for a count of critical suppliers: Art. 21(2)(d) and (3) NIS 2 and § 30 Abs. 2 Nr. 4 BSIG ask for supply chain security and for the vulnerabilities of each direct supplier to be taken into account. Identifying single points of failure is CIR 2024/2690 Annex 2.1.2(d), which binds only the digital providers the CIR covers, and tiering suppliers is ENISA guidance. 2.3 rates each supplier's risk on its own, which is where a supplier the business cannot do without shows up.",
    },
  }),
  item({
    code: "5.2",
    category: "SUP",
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "sample", id: "clause" },
      { kind: "agreements", id: "contracts" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "12.3",
    category: "REG",
    law: { bsig: 33, article: 3 },
    mustDo:
      "§ 33 Abs. 5 BSIG: every change to the registration data is reported within two weeks; no entity may opt out.",
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "prepare", id: "changes" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      contactPersonName:
        "Art. 3(4) NIS 2 and § 33 Abs. 1 BSIG ask for the company's contact details, not a named person; the duty is to report changes within two weeks (§ 33 Abs. 5 BSIG), and the walk shows what can change. The person registering knows who is in the portal, so the walk does not copy it.",
      contactPersonEmail:
        "The registration holds the company's email addresses (Art. 3(4)(b) NIS 2, § 33 Abs. 1 Nr. 2 BSIG); keeping a copy of the portal's contact here is not a duty and would go stale on its own.",
      lastRegistrationUpdate:
        "Neither text asks the company to keep its own record of when it last updated the registration; § 33 Abs. 5 BSIG asks for the update itself, within two weeks of learning of a change.",
      nextRegistrationUpdate:
        "§ 33 Abs. 5 BSIG sets no schedule, only 'unverzüglich, spätestens binnen zwei Wochen' after a change, so the Durchgang asks for no next date; the framework dropped the annual cadence for 12.3 for the same reason.",
    },
  }),
  item({
    code: "3.1",
    category: "INC",
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn", link: "bsi_it_notfallkarte" },
      {
        kind: "fields",
        id: "lead",
        fields: [
          "incidentLead",
          "itEmergencyNumber",
          "secureCommsChannel",
          "incidentEscalationContacts",
        ],
        person: "incidentLead",
      },
      { kind: "policy", id: "plan", policy: "incident_response" },
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
    law: { bsig: 32, article: 23 },
    mustDo:
      "§ 32 Abs. 1 BSIG: a significant incident is reported to the BSI within 24 hours, 72 hours and one month; the duty has no exception to decide.",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "provision", id: "clock", provision: "bsig_32_clock" },
      { kind: "sample", id: "first_report", beside: "incident_response" },
      {
        kind: "fields",
        id: "setup",
        fields: ["bsiReportingRegistered"],
        provision: "reporting_channels",
      },
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
    law: { bsig: 33, article: 3 },
    mustDo:
      "§ 33 Abs. 1 BSIG: every important and essential entity registers with the BSI within three months.",
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
      { kind: "done", id: "done" },
    ],
    notAsked: {
      registrationProofUploaded:
        "No statute asks a company to keep a proof of its registration: § 33 BSIG asks it to register, and the BSI documents neither a confirmation nor a registration number; the portal's overview of registered procedures shows it. The walk adds no evidence the law does not need (Simon, 02.10). The requirement page still takes an upload.",
    },
  }),
  item({
    code: "2.1",
    category: "RSK",
    law: { bsig: 30, article: 21 },
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
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "sample", id: "list" },
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
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "rate", id: "software", targets: "software" },
      { kind: "rate", id: "technology", targets: "technology" },
      { kind: "rate", id: "suppliers", targets: "suppliers" },
      { kind: "riskmap", id: "map" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "2.4",
    category: "RSK",
    law: { bsig: 38, article: 20 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "policy", id: "leitlinie", policy: "information_security" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      policyVersion:
        "Management approves the policy in the app at 7.3, together with every other document the walk wrote; the day of that approval is stored on the policy as its version and its start, so no one types a version.",
      policyApprovalDate:
        "The approval day is the day management approves the policy in the app at 7.3, stored on the policy itself; a typed date would be a second copy of it.",
      residualRiskCount:
        "Documenting why residual risks are accepted is CIR 2024/2690 Annex 2.1.2(j), which binds only the digital providers the CIR covers; neither § 30 BSIG nor Art. 21 NIS 2 asks for it. 2.3 proposes a treatment for each rated risk, and the requirement page keeps the acceptance.",
    },
  }),
  item({
    code: "9.1",
    category: "CRY",
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn", link: "bsi_tr_02102" },
      { kind: "crypto", id: "list" },
      { kind: "policy", id: "konzept", policy: "cryptography" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "10.1",
    category: "ACC",
    law: { bsig: 30, article: 21 },
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
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "where_first" },
      { kind: "logins", id: "logins" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      mfaTool:
        "The factor can differ per program (an app here, codes by email there), so the logins screen records it per program in asset.mfa_method; one company-wide answer would contradict those rows.",
      mfaMethods:
        "§ 30 Abs. 2 Nr. 10 BSIG asks for multi-factor solutions, not a method; the BSI states that the German act sets no assurance level and the entity chooses from its risk analysis (#nis2know MFA page). Which factor each program takes is recorded per program on the logins screen.",
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
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "answer" },
      {
        kind: "fields",
        id: "tools",
        fields: ["secureCommsTools"],
        suggest: { field: "secureCommsTools", from: "software" },
      },
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
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "updates" },
      { kind: "prepare", id: "sources" },
      {
        kind: "fields",
        id: "report",
        fields: ["vulnerabilityDisclosureUrl"],
        suggest: { field: "vulnerabilityDisclosureUrl", from: "contact" },
      },
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
  item({
    code: "4.2",
    category: "BCP",
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "fallback" },
      { kind: "critical", id: "keep" },
      { kind: "policy", id: "plan", policy: "business_continuity" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      crisisTeamLead:
        "In a company of this size the crisis is led by whoever leads in an emergency, asked in 3.1, and the plan names that person from there; asking again would let the two answers drift apart. No statute asks for a separate crisis lead. The requirement page keeps the field for a company that has one.",
      bcpActivationCriteria:
        "Conditions for activating the plan are CIR 2024/2690 Annex 4.1.2(d), which binds only the digital providers the CIR covers; no statute asks for them. The plan says in fixed words when it applies, and that the person who leads in an emergency decides in doubt.",
    },
  }),
  item({
    code: "4.4",
    category: "BCP",
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "copy" },
      { kind: "prepare", id: "ask" },
      { kind: "backups", id: "systems" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      backupFrequency:
        "Recorded per backup system on the company's list (asset.backup_frequency), where the requirement page keeps it too; a company with two backup systems has two answers.",
      lastBackupTest:
        "Recorded per backup system on the company's list (asset.last_backup_test_date): the last restore that worked from that system.",
      backupEncryption:
        "No statute asks for encrypted backups; CIR 2024/2690 Annex 4.2.2(d) asks the digital providers it covers for access controls to backup copies, and encryption belongs to § 30 Abs. 2 Nr. 8 BSIG, which 9.1 walks (its Konzept offers an encrypted-backup clause).",
      backupRestoreSuccessRate:
        "No primary source names a restore success rate; the walk records the date of the last restore that worked.",
    },
  }),
  item({
    code: "8.2",
    category: "TRN",
    law: { bsig: 30, article: 21 },
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn", link: "bsi_nis2_schulungen" },
      { kind: "sample", id: "record" },
      {
        kind: "register",
        id: "trainings",
        module: "training_record",
        audience: "staff",
      },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      trainingPlatform:
        "§ 30 Abs. 2 Nr. 7 BSIG names no format or provider; each training line records what it covered, and one platform field cannot hold several.",
      trainingFrequency:
        "The law sets no interval for staff training (§ 30 Abs. 2 Nr. 7 BSIG; Art. 20(2) NIS 2 only has Member States encourage regular staff training), and a fixed list of rhythms would pre-decide one. The BSI's suggestion (training at onboarding, an update every year) is shown on the learn screen as the BSI's.",
      trainingCompletionRate:
        "A completion rate is an effectiveness figure (CIR 2024/2690 Annex 8.1.3 for the digital providers the CIR covers, and BSI advice), not a duty, and a typed percentage would drift from the training lines.",
      lastTrainingDate:
        "The last training date is read off the training lines; a separate field would hold the same fact twice.",
      newEmployeeOnboarding:
        "Reaching new employees is CIR 2024/2690 Annex 8.1.2(a) for the digital providers the CIR covers, and the BSI's onboarding training is advice; a briefing on a new employee's first day is a training line like any other.",
    },
  }),
  item({
    code: "12.4",
    category: "REG",
    law: { bsig: 31, article: null },
    onlyFor: "kritis",
    mustDo:
      "§ 31 Abs. 2 and § 39 Abs. 1 BSIG: operators of critical facilities „sind verpflichtet“ to run attack detection and „haben“ to give the evidence.",
    glossary: [],
    reviewed: "2026-10-03",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "fields", id: "detection", fields: ["attackDetectionSystem"] },
      { kind: "prepare", id: "evidence" },
      { kind: "fields", id: "last", fields: ["lastKritisEvidenceDate"] },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      informationSharingCompliant:
        "The field is labelled after § 34 BSIG, which is the special registration of the § 60 Abs. 1 entity types, not a duty of operators of critical facilities; sharing information through the BSI's platform is voluntary (§ 6 BSIG).",
      correspondenceLogUploaded:
        "No statute asks for a correspondence log: handing documents over when the BSI asks follows from its supervisory powers (§ 61 Abs. 5, § 62 BSIG), and § 39 Abs. 1 asks for the evidence itself, which the walk records by the day it was last sent.",
    },
  }),
  item({
    code: "7.3",
    category: "EFF",
    law: { bsig: 30, article: 21 },
    mustDo:
      "§ 38 Abs. 1 BSIG: management implements and oversees the measures, and this item is where it approves them; a decision not to approve is not a way to finish.",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "prepare", id: "inputs" },
      { kind: "riskmap", id: "risks" },
      { kind: "sample", id: "record" },
      { kind: "register", id: "review", module: "management_review" },
      { kind: "approve", id: "approve" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      lastManagementReview:
        "The review's date is its line in the management review register; a second date field would hold the same fact twice.",
      managementReviewReportUploaded:
        "Neither § 38 Abs. 1 nor § 30 BSIG asks for signed minutes; the review is recorded in the register and the documents management approved are marked approved. The requirement page keeps the upload for a company that has minutes.",
    },
  }),
];
