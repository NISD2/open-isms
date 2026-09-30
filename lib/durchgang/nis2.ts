/**
 * The NIS 2 Durchgang: which screens each item shows, in which order. Data only.
 *
 * The walk follows the journey order (`JOURNEY_ORDER`), so the order of this list does not
 * matter. v1 walks the first ten items of that order, less the ones in `NOT_WALKED`; an item is
 * added here only together with its reviewed copy in messages/durchgang.
 */

import type { CategoryCode } from "@/lib/compliance/category-schemas";
import type { AnyItem, Item } from "./types";

const item = <C extends CategoryCode>(i: Item<C>): Item<C> => i;

/**
 * Items of the first ten the walk leaves out, each with the reason. The requirement page keeps
 * them.
 */
export const NOT_WALKED: Readonly<Record<string, string>> = {
  "12.1":
    "Whoever reaches the Durchgang already knows their entity type; the walk does not decide it for them.",
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
      { kind: "done", id: "done" },
    ],
    notAsked: {
      singlePointOfFailureCount:
        "Neither § 30 BSIG nor Art. 21 NIS 2 asks for a count of irreplaceable suppliers; only CIR 2.1.2(d) names single points of failure, for its digital providers. Each supplier is rated on its own row instead.",
    },
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
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "fields", id: "lead", fields: ["incidentLead"] },
      { kind: "fields", id: "escalation", fields: ["incidentEscalationContacts"] },
      { kind: "compare", id: "second_way" },
      { kind: "fields", id: "channel", fields: ["secureCommsChannel"] },
      { kind: "evidence", id: "plan", field: null },
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
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "provision", id: "clock", provision: "bsig_32_clock" },
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
      { kind: "done", id: "done" },
    ],
    notAsked: {
      classificationLevels:
        "Protection levels (Schutzbedarf normal, hoch, sehr hoch) are the BSI 200-2 method; neither § 30 BSIG nor Art. 21 NIS 2 asks for them, and a small company rates each asset on its own before choosing a scale.",
    },
  }),
];
