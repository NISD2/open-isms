/**
 * The NIS 2 Durchgang: which screens each item shows, in which order. Data only.
 *
 * The walk follows the journey order (`JOURNEY_ORDER`), so the order of this list does not
 * matter. It walks the front of that order, less the items in `NOT_WALKED`; an item is added here
 * only together with its reviewed copy in messages/durchgang.
 */

import { JOURNEY_ORDER } from "@/lib/compliance/journey-position";
import { BCP_ITEMS } from "./nis2-bcp";
import { item, MANAGEMENT, MEASURES, REGISTRATION } from "./nis2-item";
import { NOT_WALKED } from "./nis2-not-walked";
import type { AnyItem, AnyScreen, Walk } from "./types";

const NIS2_SCRIPT: readonly AnyItem[] = [
  item({
    code: "1.1",
    category: "GOV",
    law: MANAGEMENT,
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
    law: MEASURES,
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
    law: MEASURES,
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
    law: REGISTRATION,
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
    law: MEASURES,
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
    law: { act: "nis2", bsig: 32, article: 23 },
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
    law: REGISTRATION,
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
        today: ["bsiRegistrationDate"],
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
    law: MEASURES,
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
    law: MEASURES,
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
    law: MEASURES,
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
    law: MANAGEMENT,
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
    law: MEASURES,
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
    law: MEASURES,
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
    law: MEASURES,
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
    law: MEASURES,
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
    law: MEASURES,
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
  ...BCP_ITEMS,
  item({
    code: "8.2",
    category: "TRN",
    law: MEASURES,
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
    law: { act: "nis2", bsig: 31, article: null },
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
    law: MEASURES,
    mustDo:
      "§ 38 Abs. 1 BSIG: management implements and oversees the measures; Art. 20(1) NIS 2: it approves them, here. Declining to approve is no way to finish.",
    glossary: [],
    reviewed: "2026-10-01",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "prepare", id: "inputs" },
      { kind: "riskmap", id: "risks" },
      { kind: "sample", id: "record" },
      { kind: "register", id: "review", module: "management_review" },
      { kind: "approve", id: "approve" },
      { kind: "ongoing", id: "ongoing" },
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

const approves = (i: AnyItem): boolean =>
  i.screens.some((s: AnyScreen) => s.kind === "approve");

const IN_JOURNEY_ORDER: readonly AnyItem[] = JOURNEY_ORDER.flatMap((code) => {
  const found = NIS2_SCRIPT.find((i) => i.code === code);
  return found ? [found] : [];
});

/**
 * The NIS 2 walk in journey order, with the approval last: management signs what came before it,
 * including an item the journey puts later. A company not set up yet walks up to the registration
 * (12.2), which asks for the name with its legal form and the sector (§ 33 Abs. 1 Nr. 1 and 3
 * BSIG) that setting up then asks for again (Simon, 04.10.2026: "after the registration they will
 * understand and they will actually know what to fill out here").
 */
export const NIS2_WALK: Walk = {
  framework: "nis2",
  items: [
    ...IN_JOURNEY_ORDER.filter((i) => !approves(i)),
    ...IN_JOURNEY_ORDER.filter(approves),
  ],
  notWalked: NOT_WALKED,
  locales: ["de", "en", "cs"],
  setupAfter: "12.2",
  // Listing what the company has, so the account sees its own data collected before it orders
  // (Simon, 20.10.2026: "make the paywall up until 'Write down what your company has'").
  lastFreeStep: "2.2",
};
