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

/**
 * A quantity with a unit — the shape a threshold claim takes.
 *
 * Digits alone were not enough. The first version of this test matched only
 * `\d`, and a follow-up factcheck found two claims it had waved through: a
 * post-incident review due "innerhalb von zwei Wochen" (spelled out) and a
 * "Bußgelder bis 500.000 €" (currency symbol rather than the word "Euro").
 * Both were wrong. Number words and currency symbols are in the pattern now.
 */
const NUMBER = String.raw`(?:\d[\d.,]*|ein|eine|einem|einer|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|zwölf|one|two|three|four|five|six|seven|eight|nine|ten|twelve)`;
const UNIT = String.raw`(?:Stunden?|Tage[n]?|Wochen?|Monate[n]?|Jahre[n]?|Prozent|EUR|Euro|hours?|days?|weeks?|months?|years?|percent)`;
/** Scale words that sit between the figure and its currency: "10 Mio. €". */
const SCALE = String.raw`(?:\s*(?:Mio\.?|Mrd\.?|Millionen|Milliarden|million|billion|M|k))?`;
const QUANTITY = new RegExp(
  // "3 Jahre", "zwei Wochen", "50 %", "10 Mio. €", "€50M", "500.000 €".
  // The trailing \b matters: without it "einem Jahresplan" reads as "einem Jahre".
  String.raw`\b${NUMBER}\s*(?:${UNIT})\b|\b${NUMBER}${SCALE}\s*[%€$£]|[%€$£]\s*${NUMBER}${SCALE}`,
  "gi",
);

/**
 * Compare on a normalised form so a German dative or an English plural does
 * not need its own allowlist entry: "90 Tagen" is the same claim as "90 Tage".
 */
function normalise(quantity: string): string {
  return quantity
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[ns]$/, "");
}

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
  "1.1": {
    values: ["drei Jahre", "three years"],
    why: "This platform's own default review interval, and the sentence says so: §38(3) BSIG says 'regelmäßig' and the text tells the reader to set and justify their own.",
  },
  "12.1": {
    values: [
      "50 Millionen Euro",
      "43 Millionen Euro",
      "10 Millionen Euro",
      "50 million euro",
      "43 million euro",
      "10 million euro",
      "zwei Jahre",
    ],
    why: "§28 BSIG size thresholds, verbatim. Note the conjunction: turnover AND balance-sheet total, not either. The two-year look-back is the practical instruction for reading your own figures.",
  },
  "12.3": {
    values: ["zwei Wochen", "2 Wochen", "two weeks"],
    why: "§33(5) BSIG: changes to registration data go to the BSI 'unverzüglich, spätestens jedoch binnen zwei Wochen'. Verbatim in the statute.",
  },
  "7.1": {
    values: ["one month"],
    why: "Suggests piloting the KPI dashboard for a month before fixing it. A trial period, not a duty.",
  },
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

        const permitted = new Set(allowed.values.map(normalise));
        const unlisted = quantities.filter((q) => !permitted.has(normalise(q)));
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
