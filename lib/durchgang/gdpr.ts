/**
 * The GDPR walk (DSGVO Durchgang): which screens each item shows, in walk order. Data only.
 *
 * It walks the GDPR requirements the data model carries (packages/grc-data-model gdpr.ts), which
 * are selected duties of a controller and not the whole GDPR; the first item's copy says so. Copy
 * in German and English, written from the primary texts (NIS2
 * reviews/legal/2026-10-20-gdpr-walkthrough-copy.md). No GDPR article requires a signature: the
 * approval at the end is how the company records its decisions (Art. 5(2), 24(1)), and the copy
 * says it is the app's practice.
 */

import type { CategoryCode } from "@/lib/compliance/category-schemas";
import type { AnyItem, Item, Walk } from "./types";

const item = <C extends CategoryCode>(i: Item<C>): Item<C> => i;

const law = (article: number) => ({ act: "gdpr", article }) as const;

/** Requirements of the GDPR the walk leaves out, each with the reason; the requirement page keeps them. */
const NOT_WALKED: Readonly<Record<string, string>> = {
  "G-BRC.2":
    "Art. 33(5) GDPR documents each personal data breach when it happens: the facts, its effects and the remedial action taken, including a breach that was not notified. Nothing exists to document on the day the walk runs. The breach procedure G-BRC.1 writes says that every breach is recorded, and the incident register on the requirement page holds each one.",
};

const GDPR_SCRIPT: readonly AnyItem[] = [
  item({
    code: "G-DPO.1",
    category: "DPO",
    law: law(37),
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      // The walk's first screen: the few words every later screen uses, for someone starting
      // from nothing.
      { kind: "learn", id: "basics" },
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "examples" },
      { kind: "fields", id: "decision", fields: ["dpoDecision"] },
      {
        kind: "fields",
        id: "who",
        fields: ["dpoName", "dpoContact", "dpoAuthorityNotifiedOn"],
        person: "dpoName",
        // Art. 38(6) GDPR: other tasks only without a conflict of interest, decided case by case
        // (CJEU C-453/21, para 45); leading incident response is one to check.
        apart: [{ code: "3.1", field: "incidentLead" }],
        unless: { field: "dpoDecision", is: "none" },
      },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "G-ROP.1",
    category: "ROP",
    law: law(30),
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "sample", id: "line" },
      { kind: "activities", id: "staff", groups: ["staff"] },
      { kind: "activities", id: "customers", groups: ["customers"] },
      { kind: "activities", id: "online", groups: ["online"] },
      { kind: "activities", id: "operations", groups: ["operations"] },
      {
        kind: "describe",
        id: "what",
        facts: ["purpose", "dataSubjects", "dataCategories", "specialCategories"],
      },
      { kind: "describe", id: "basis", facts: ["legalBases"] },
      { kind: "describe", id: "who", facts: ["recipients", "transfersOutsideEea"] },
      { kind: "describe", id: "keep", facts: ["retention"] },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "G-DPA.1",
    category: "DPA",
    law: law(28),
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "who_is" },
      { kind: "processors", id: "role", fact: "role" },
      { kind: "processors", id: "contract", fact: "contract" },
      { kind: "processors", id: "where", fact: "transfer" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "G-DPA.2",
    category: "DPA",
    law: law(28),
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "examples" },
      { kind: "processors", id: "authorisation", fact: "subprocessing" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "G-TOM.1",
    category: "TOM",
    law: law(32),
    mustDo:
      "Art. 32(1) GDPR: the controller „shall implement“ appropriate technical and organisational measures; the article sets what is appropriate, not whether.",
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      { kind: "learn", id: "learn" },
      {
        kind: "policy",
        id: "measures",
        policy: "gdpr_security_measures",
        // Art. 32(1)(c): a restore test on record in NIS 2 4.4 is the evidence for the clause.
        tickWhen: [{ clause: "restore_tests", when: "restore_tested" }],
      },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "G-BRC.1",
    category: "BRC",
    law: law(33),
    mustDo:
      "Art. 33(1) GDPR: a personal data breach „shall“ be notified within 72 hours unless it is unlikely to result in a risk; no controller may opt out of the duty.",
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "notify" },
      // The procedure names this person; asked here so it is never blank without the NIS 2 walk.
      // Neither Art. 33 GDPR nor Art. 23 NIS 2 asks for two people, so it starts on the NIS 2
      // incident lead where the company named one.
      {
        kind: "fields",
        id: "lead",
        fields: ["breachLead"],
        person: "breachLead",
        carry: { field: "breachLead", from: { code: "3.1", field: "incidentLead" } },
      },
      { kind: "policy", id: "procedure", policy: "gdpr_breach_procedure" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "G-BRC.3",
    category: "BRC",
    law: law(34),
    mustDo:
      "Art. 34(1) GDPR: where a breach is likely to result in a high risk, the controller „shall“ tell the people affected; the exceptions of Art. 34(3) are decided per breach.",
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "policy", id: "notice", policy: "gdpr_breach_notice" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "G-DSR.1",
    category: "DSR",
    law: law(12),
    mustDo:
      "Art. 12(3) GDPR: a request „shall“ be answered within one month; every controller receives requests.",
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "prepare", id: "rights" },
      {
        kind: "fields",
        id: "inbox",
        fields: ["requestHandler", "requestAddress"],
        person: "requestHandler",
        suggest: { field: "requestAddress", from: "contact" },
      },
      { kind: "policy", id: "procedure", policy: "gdpr_request_procedure" },
      { kind: "done", id: "done" },
    ],
  }),
  item({
    code: "G-ACT.1",
    category: "ACT",
    law: law(24),
    mustDo:
      "Art. 5(2) and 24(1) GDPR: the controller „shall“ be able to demonstrate compliance; the approval in the app is how it records that, so declining it is no way to finish.",
    glossary: [],
    reviewed: "2026-10-20",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "policy", id: "policy", policy: "gdpr_data_protection_policy" },
      { kind: "approve", id: "approve" },
      { kind: "ongoing", id: "ongoing" },
      { kind: "done", id: "done" },
    ],
  }),
];

/**
 * The GDPR walk. The data protection officer comes first, since the notices and procedures name
 * them; the record of processing activities next, which every later step reads; the approval
 * last. It opens only to a company already set up: setting a company up is the NIS 2 walk's step.
 */
export const GDPR_WALK: Walk = {
  framework: "gdpr",
  items: GDPR_SCRIPT,
  notWalked: NOT_WALKED,
  locales: ["de", "en"],
  setupAfter: null,
};
