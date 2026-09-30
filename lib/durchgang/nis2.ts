/**
 * The NIS 2 Durchgang: which screens each item shows, in which order. Data only.
 *
 * The walk follows the journey order (`JOURNEY_ORDER`), so the order of this list does not
 * matter. v1 walks the first ten items of that order; an item is added here only together with
 * its reviewed copy in messages/durchgang.
 */

import type { CategoryCode } from "@/lib/compliance/category-schemas";
import type { AnyItem, Item } from "./types";

const item = <C extends CategoryCode>(i: Item<C>): Item<C> => i;

export const NIS2_SCRIPT: readonly AnyItem[] = [
  item({
    code: "12.2",
    category: "REG",
    glossary: ["bsiRegistration", "muk"],
    reviewed: "2026-09-30",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "prepare", id: "data" },
      { kind: "compare", id: "contact" },
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
      { kind: "reading", id: "reading", frequency: "frequent", impact: "limited" },
      { kind: "adopt", id: "adopt", adopts: "bsi_200_3_method" },
      { kind: "decide", id: "acceptance", decision: "risk_acceptance" },
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
      { kind: "fields", id: "protection", fields: ["classificationLevels"] },
      { kind: "done", id: "done" },
    ],
  }),
];
