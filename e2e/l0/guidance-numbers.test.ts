/**
 * L0 guidance numbers (bun test, no browser, milliseconds).
 *
 * `data/guidance/{de,en}.json` is LLM-generated and, until this PR, was loaded
 * on every requirement page and never rendered. Rendering it turned it into
 * product copy, and a spot-check found invented thresholds stated as law:
 * "die Geschäftsführung muss eine Schulung machen, die mindestens 4 Stunden
 * dauert" (§38(3) BSIG says "regelmäßig" and sets no hours), "tragen Sie 10
 * Prozent des IT-Budgets ein" (no such figure exists in NIS 2 or the BSIG),
 * and a four-tier patch SLA table attributed to the BSI that the BSI does not
 * publish.
 *
 * For a compliance product a fabricated threshold is not a typo — a customer
 * quotes it to an auditor. So every number that survives has to be justified
 * here, by requirement code, with where it comes from. Adding a number to the
 * guidance without adding it below fails this test, which puts the decision in
 * front of a reviewer instead of shipping silently.
 *
 * Regex over free-form prose is the right tool here; this is generated German
 * and English text, not code or a structured format.
 */
import { describe, test, expect } from "bun:test";
import de from "@/data/guidance/de.json";
import en from "@/data/guidance/en.json";
import type { GuidanceFile } from "@/lib/ai/guidance-types";

/** Prose fields shown to the reader. `fields` holds per-field help, which the
 *  UI does not currently render. */
const PROSE_FIELDS = [
  "summary",
  "applicability",
  "quickTip",
  "implementationSteps",
  "evidenceExample",
] as const;

/** A quantity with a unit — the shape a threshold claim takes. */
const QUANTITY =
  /\d[\d.,]*\s*(Stunden|Stunde|Tage|Tagen|Monate|Monaten|Jahre|Jahren|%|Prozent|EUR|Euro|hours|hour|days|day|months|month|years|year|percent)/gi;

/**
 * Numbers allowed to appear in a requirement's guidance, and why.
 *
 * Two kinds qualify. Either the figure is in the legal reference the
 * requirement cites — the §32 BSIG / Art. 23 NIS 2 reporting clock is the
 * clearest case — or the surrounding sentence hands the choice to the reader
 * ("a deadline you set", "for example") rather than asserting a duty.
 *
 * A number with no entry here is a claim nobody has checked.
 */
const ALLOWED: Record<string, { values: string[]; why: string }> = {
  "3.1": {
    values: ["24 hours", "72 hours", "1 month"],
    why: "§32(1) BSIG: Erstmeldung 24h, Meldung 72h, Abschlussmeldung one month. Verbatim in the statute.",
  },
  "3.3": {
    values: ["24 Stunden", "72 Stunden", "24 hours", "72 hours", "1 month"],
    why: "Same §32(1) BSIG clock — this requirement is the reporting process itself.",
  },
  "5.2": {
    values: ["72 Stunden"],
    why: "Supplier contract clause mirroring the §32 BSIG deadline the entity itself is held to.",
  },
  "6.4": {
    values: ["90 Tage", "90 days"],
    why: "BSI IT-Grundschutz OPS.1.1.3 places remediation in the internationally common 45-90 day window. Cited as orientation; the sentence says the reader sets their own deadline, since CIR 6.6 names none.",
  },
  "11.1": {
    values: ["3 Monate", "3 months", "12 months"],
    why: "Rollout sequencing offered as a plan, not a duty. CIR 11.7 requires MFA and sets no timetable.",
  },
  "12.4": {
    values: ["48 Stunden", "48 hours", "6 Monate", "3 Jahre"],
    why: "48h is framed as a goal the reader sets ('z. B.', 'set a goal like'). The 3-year cycle is the §39 BSIG evidence obligation named in this requirement's legalRef.",
  },
  "4.4": {
    values: ["3 months"],
    why: "Restore-test cadence offered as a suggestion. CIR 4.2 requires backup testing without an interval.",
  },
  "5.4": {
    values: ["90%"],
    why: "Written as an illustration of a metric (\"like '90% notified on time'\"), not a target to hit.",
  },
  "7.2": {
    values: ["3 years"],
    why: "Audit-cycle suggestion ('over 2-3 years, based on risks'), the ISO 27001 convention. Not asserted as a legal interval.",
  },
  "7.3": {
    values: ["3 years"],
    why: "§39 BSIG evidence cycle for KRITIS operators, named in this requirement's legalRef.",
  },
  "8.2": {
    values: ["12 month"],
    why: "Refers to an annual training plan, matching the requirement's own annual frequency.",
  },
  "9.1": {
    values: ["3 Jahre", "3 years"],
    why: "Crypto review cadence offered as a suggestion. CIR 9.1/9.3 require review without an interval.",
  },
};

function quantitiesIn(entry: Record<string, unknown>): string[] {
  const found = new Set<string>();
  for (const field of PROSE_FIELDS) {
    const text = String(entry[field] ?? "");
    for (const match of text.matchAll(QUANTITY)) {
      found.add(match[0].replace(/\s+/g, " ").trim());
    }
  }
  return [...found];
}

describe("every number in the rendered guidance is accounted for", () => {
  for (const [locale, file] of [
    ["de", de as unknown as GuidanceFile],
    ["en", en as unknown as GuidanceFile],
  ] as const) {
    for (const [code, entry] of Object.entries(file)) {
      const quantities = quantitiesIn(entry as unknown as Record<string, unknown>);
      if (quantities.length === 0) continue;

      test(`${locale} ${code}`, () => {
        const allowed = ALLOWED[code];
        expect(
          allowed,
          `${code} (${locale}) states ${quantities.join(", ")} and has no entry in ALLOWED. ` +
            `Either the figure comes from the requirement's legal reference — add it with the citation — ` +
            `or it was invented and belongs out of the guidance.`,
        ).toBeDefined();

        const unlisted = quantities.filter((q) => !allowed.values.includes(q));
        expect(
          unlisted,
          `${code} (${locale}) states ${unlisted.join(", ")}, which ALLOWED does not cover. ${allowed?.why ?? ""}`,
        ).toEqual([]);
      });
    }
  }
});

describe("the claims this test was written for stay gone", () => {
  const banned: { needle: RegExp; what: string }[] = [
    {
      needle: /mindestens 4 Stunden|at least 4 hours|4-hour cybersecurity training/i,
      what: "a minimum training duration — §38(3) BSIG says 'regelmäßig' and sets no hours",
    },
    {
      needle: /\d+\s*(Prozent|%)\s*(davon|of that)?\s*(als Cybersicherheitsbudget|for cybersecurity)|7-15%|25\.000 Euro/i,
      what: "a cybersecurity budget as a share of IT spend — no such figure exists in NIS 2 or the BSIG",
    },
    {
      needle: /BSI empfiehlt:|BSI recommends:/i,
      what: "a recommendation attributed to the BSI that the BSI does not publish",
    },
  ];

  for (const [locale, file] of [
    ["de", de as unknown as GuidanceFile],
    ["en", en as unknown as GuidanceFile],
  ] as const) {
    for (const { needle, what } of banned) {
      test(`${locale}: no ${what}`, () => {
        const offenders = Object.entries(file)
          .filter(([, entry]) =>
            PROSE_FIELDS.some((f) =>
              needle.test(String((entry as unknown as Record<string, unknown>)[f] ?? "")),
            ),
          )
          .map(([code]) => code);
        expect(offenders, `${offenders.join(", ")} reintroduced ${what}`).toEqual([]);
      });
    }
  }
});
