/**
 * Values here are seeded into `requirement` / `requirement_category` rows.
 * Editing them changes what a FRESH seed produces; it does not reach a
 * database that is already seeded (production included). After changing
 * anything below, run `bun db:framework-migration` to emit the data
 * migration that carries it forward. `bun db:generate` will not: it diffs
 * the schema, and row content is not schema.
 */
import type { FrameworkCategory, FrameworkRequirement } from "./types";
import { makeRequirementFactory } from "./types";

const mkReq = makeRequirementFactory("gdpr-req");

/** The GDPR's official text on EUR-Lex, at an article (`art_28`) or chapter (`cpt_III`) anchor. */
const eurLex = (anchor: string): string =>
  `https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng#${anchor}`;

export const gdprCategories: FrameworkCategory[] = [
  {
    id: "gdpr-cat-01",
    code: "DPA",
    slug: "gdpr-processor-agreements",
    referenceUrl: eurLex("art_28"),
    nationalUrl: "",
    sortOrder: 1,
    estimatedMinutes: 60,
    relevantRoles: ["legal", "ciso"],
  },
  {
    id: "gdpr-cat-02",
    code: "ROP",
    slug: "gdpr-records-of-processing",
    referenceUrl: eurLex("art_30"),
    nationalUrl: "",
    sortOrder: 2,
    estimatedMinutes: 90,
    relevantRoles: ["legal"],
  },
  {
    id: "gdpr-cat-03",
    code: "TOM",
    slug: "gdpr-toms",
    referenceUrl: eurLex("art_32"),
    nationalUrl: "",
    sortOrder: 3,
    estimatedMinutes: 60,
    relevantRoles: ["ciso"],
  },
  {
    id: "gdpr-cat-04",
    code: "BRC",
    slug: "gdpr-breach-response",
    referenceUrl: eurLex("art_33"),
    nationalUrl: "",
    sortOrder: 4,
    estimatedMinutes: 45,
    relevantRoles: ["ciso", "legal"],
  },
  {
    id: "gdpr-cat-05",
    code: "DSR",
    slug: "gdpr-data-subject-rights",
    // Chapter III, not Art. 15 alone: this category spans Art. 12-22.
    // nationalUrl is set here and nowhere else in this framework, because this
    // is the only category a German provision actually modifies: §34 BDSG
    // restricts the Art. 15 right of access, §35 substitutes restriction of
    // processing for Art. 17 erasure where, in non-automated processing, erasure
    // is impossible or disproportionate because of the way the data is stored
    // AND the data subject's interest in erasure is minor (never for data
    // processed unlawfully), and §34(2) adds a duty to document the reasons for a
    // refusal that has no GDPR equivalent. Arts. 28, 30, 32 and 33 have no such
    // German overlay, so their categories keep nationalUrl empty.
    referenceUrl: eurLex("cpt_III"),
    nationalUrl: "https://www.gesetze-im-internet.de/bdsg_2018/__34.html",
    sortOrder: 5,
    estimatedMinutes: 60,
    relevantRoles: ["legal"],
  },
  // nationalUrl stays empty even though §38 BDSG is what actually triggers the
  // appointment for a German controller. The GDPR applies directly; §38 is an
  // Art. 37(4) opening-clause addition, not a transposition, so the BDSG cite
  // travels in the requirement's legalRef rather than as a second citation row.
  {
    id: "gdpr-cat-06",
    code: "DPO",
    slug: "gdpr-data-protection-officer",
    referenceUrl: eurLex("art_37"),
    nationalUrl: "",
    sortOrder: 6,
    estimatedMinutes: 45,
    relevantRoles: ["legal", "ceo"],
  },
];

/**
 * `frequency` is stated on every requirement below rather than left to the
 * factory default of "annual". The default silently gave an annual review
 * cadence to the two duties the GDPR triggers per event rather than per
 * cycle (G-BRC.2, G-DSR.1). The GDPR sets no yearly interval anywhere: measures
 * are "reviewed and updated where necessary" (Art. 24(1)), tested "regularly"
 * (Art. 32(1)(d)), the record is "maintained" (Art. 30(1)). So no row here is
 * "annual"; a yearly review is a recommendation the copy may give as one.
 */
const REQUIREMENTS_BY_SLUG: Record<string, () => FrameworkRequirement[]> = {
  "gdpr-processor-agreements": () => [
    mkReq("G-DPA.1", "document", {
      legalRef: "GDPR Art. 28(3)",
      frameworkRef: "Art. 28",
      moduleRef: "supplier",
      priority: "P1",
      frequency: "on-change",
    }),
    // The controller's side of sub-processing. (2) is the whole authorisation
    // rule: no sub-processor without the controller's prior specific or general
    // written authorisation. (4) binds the processor, not the controller: it
    // imposes the same obligations on the sub-processor and keeps the initial
    // processor liable. The controller's hook on (4) is the contract term in
    // (3)(d), that the processor "respects the conditions referred to in
    // paragraphs 2 and 4". The processor's own duties belong to the company in
    // the processor role, a requirement of its own.
    mkReq("G-DPA.2", "document", {
      legalRef: "GDPR Art. 28(2), 28(3)(d)",
      frameworkRef: "Art. 28",
      moduleRef: "supplier",
      priority: "P1",
      frequency: "on-change",
    }),
  ],
  "gdpr-records-of-processing": () => [
    // legalRef carries (5) as well as (1) because the derogation is the first
    // thing a controller in this product's size band asks about: Art. 30(5)
    // exempts an organisation employing fewer than 250 persons, which is every
    // company in the 50-250 ICP. It almost never applies. The three exceptions
    // are disjunctive and one is enough, and "the processing is not occasional"
    // catches any employer running payroll or personnel records. Stating (1)
    // alone invited the reader to assume the exemption was overlooked; stating
    // both is what makes the requirement defensible to a Datenschutzbeauftragte.
    // moduleRef "asset" is a stand-in: Art. 30(1) records processing activities,
    // and the asset row holds one personal-data flag. The record gets its own
    // table when the GDPR walkthrough is built, and moduleRef moves with it.
    mkReq("G-ROP.1", "document", {
      legalRef: "GDPR Art. 30(1), (5)",
      frameworkRef: "Art. 30",
      moduleRef: "asset",
      priority: "P0",
      frequency: "on-change",
    }),
  ],
  "gdpr-toms": () => [
    mkReq("G-TOM.1", "document", {
      legalRef: "GDPR Art. 32(1)",
      frameworkRef: "Art. 32",
      moduleRef: "policy",
      priority: "P0",
      frequency: "on-change",
    }),
  ],
  "gdpr-breach-response": () => [
    // (1), (3) and (4) rather than a bare "Art. 33", so this requirement and
    // G-BRC.2 below divide the controller's part of the article between them.
    // (2) is left out: "The processor shall notify the controller" binds the
    // company in the processor role, a requirement of its own; a controller's
    // procedure only receives such notices. The two clauses that decide what
    // the procedure actually does both live in (1): notification is owed
    // "unless the personal data breach is unlikely to result in a risk to the
    // rights and freedoms of natural persons", and a filing made after 72 hours
    // "shall be accompanied by reasons for the delay". A procedure that knows
    // only the 72-hour number cannot answer either question.
    mkReq("G-BRC.1", "document", {
      legalRef: "GDPR Art. 33(1), (3), (4)",
      frameworkRef: "Art. 33",
      moduleRef: "policy",
      priority: "P0",
      frequency: "on-change",
    }),
    // Art. 33(5) documents each breach as it happens, not on a review cycle.
    mkReq("G-BRC.2", "document", {
      legalRef: "GDPR Art. 33(5)",
      frameworkRef: "Art. 33",
      moduleRef: "incident",
      priority: "P1",
      frequency: "on-change",
    }),
    // Art. 34 is a second, separate addressee: the data subjects themselves,
    // owed only where the breach is likely to result in a HIGH risk to them.
    // Art. 33 notification to the authority does not discharge it, and the
    // Art. 34(3) carve-outs (data rendered unintelligible, risk since
    // mitigated, disproportionate effort) are decided per breach.
    mkReq("G-BRC.3", "document", {
      legalRef: "GDPR Art. 34",
      frameworkRef: "Art. 34",
      moduleRef: "policy",
      priority: "P1",
      frequency: "on-change",
    }),
  ],
  "gdpr-data-subject-rights": () => [
    // The one-month deadline this requirement asserts is Art. 12(3); the
    // rights themselves are Art. 15-22. Art. 12(4)-(6) carry the refusal,
    // fee and identity-doubt rules the same workflow has to handle.
    // "ongoing", not "on-change": the clock starts when a request arrives,
    // which is not a change to anything the company controls.
    mkReq("G-DSR.1", "document", {
      legalRef: "GDPR Art. 12(3)-(6), Art. 15-22",
      frameworkRef: "Art. 12-22",
      priority: "P1",
      frequency: "ongoing",
    }),
  ],
  "gdpr-data-protection-officer": () => [
    // The GDPR compels appointment in the three Art. 37(1) cases. Point (c)
    // reads "special categories of data pursuant to Article 9 and personal data
    // relating to criminal convictions" in English, and "oder" in German, so in
    // the German text large-scale processing of health data as a core activity
    // is enough. Our reading: that can catch NIS 2 entities in health care
    // whatever the headcount. §38(1) BDSG uses the Art. 37(4) opening clause to add a German
    // threshold: "in der Regel mindestens 20 Personen ständig mit der
    // automatisierten Verarbeitung personenbezogener Daten" employed, plus two
    // headcount-independent triggers (processing subject to a DPIA, and
    // commercial processing for transfer, anonymised transfer or market or
    // opinion research). Most companies in the 50-250 band are over the 20.
    // "on-change": the threshold is dynamic, so the test is re-run when
    // headcount or the kind of processing changes, not on a review cycle.
    mkReq("G-DPO.1", "document", {
      legalRef: "GDPR Art. 37-39, §38 BDSG",
      frameworkRef: "Art. 37-39",
      priority: "P0",
      frequency: "on-change",
    }),
  ],
};

export function getGdprRequirementsForCategory(slug: string): FrameworkRequirement[] {
  const builder = REQUIREMENTS_BY_SLUG[slug];
  if (!builder) return [];
  return builder();
}
