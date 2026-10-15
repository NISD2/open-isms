/**
 * Czech law as the Czech pages cite it, the way German pages cite the BSIG: zákon č. 264/2025 Sb.,
 * o kybernetické bezpečnosti, and its two measure decrees. A requirement's places are authored in
 * `getNis2CzechRef` in the framework data and read from its `requirement` row. Links open the
 * official e-Sbírka text, in the version in force from 1 November 2025, at the first section a
 * citation names; e-Sbírka's own API gives that address for each section
 * ("/sb/2025/410/2025-11-01#par_4").
 *
 * Kept free of server imports, like ./citations, so client components can use it.
 */

import type { CzechRef, CzechRefColumns } from "@nisd2/grc-data-model/frameworks";
import type { PenaltyTier } from "@/lib/applicability/classify";
import type { Report, ReportText } from "./bsig-32";

const ESB_VERSION = "2025-11-01";

/** Each text: its number in the collection, its name as a row label, and "of the text" for a citation. */
const CZECH_TEXTS = {
  act: {
    number: 264,
    label: "Zákon č. 264/2025 Sb.",
    genitive: "zákona č. 264/2025 Sb.",
  },
  lower: {
    number: 410,
    label: "Vyhláška č. 410/2025 Sb. (nižší režim)",
    genitive: "vyhlášky č. 410/2025 Sb.",
  },
  higher: {
    number: 409,
    label: "Vyhláška č. 409/2025 Sb. (vyšší režim)",
    genitive: "vyhlášky č. 409/2025 Sb.",
  },
} as const;

export type CzechPart = keyof typeof CZECH_TEXTS;

const CZECH_PARTS: readonly CzechPart[] = ["act", "lower", "higher"];

export interface CzechCitation {
  readonly part: CzechPart;
  readonly label: string;
  readonly citation: string;
  readonly href: string;
}

/** The first section a citation names ("§ 4 písm. b); § 5" gives 4). Free text, so a pattern. */
const firstSection = (citation: string): string | null =>
  /^§§?\s*(\d+)/.exec(citation)?.[1] ?? null;

const czechHref = (part: CzechPart, citation: string): string => {
  const section = firstSection(citation);
  const anchor = section === null ? "" : `#par_${section}`;
  return `https://e-sbirka.gov.cz/sb/2025/${CZECH_TEXTS[part].number}/${ESB_VERSION}${anchor}`;
};

/**
 * A requirement row's place in Czech law; null where it has none (every framework but NIS 2). The
 * inverse of `czechRefColumns`, which the seed writes the row with.
 */
export const czechRefOf = (row: CzechRefColumns): CzechRef | null =>
  row.czActRef === null && row.czLowerRef === null && row.czHigherRef === null
    ? null
    : { act: row.czActRef, lower: row.czLowerRef, higher: row.czHigherRef };

/**
 * The one-line legal reference a requirement shows where there is room for one line (the journey,
 * a category's cards, a document's section): on a Czech page its place in Czech law, as the walk's
 * duty card cites it; on any other page, or where Czech law has no place for it, its `legalRef`.
 */
export const legalRefFor = (
  row: CzechRefColumns & { readonly legalRef: string | null },
  locale: string | undefined,
): string | null =>
  locale === "cs"
    ? (czechDutyCitation(czechRefOf(row))?.cite ?? row.legalRef)
    : row.legalRef;

/** A requirement's Czech places in reading order: the Act, then the lower and higher decree. */
export const czechCitations = (ref: CzechRef): readonly CzechCitation[] =>
  CZECH_PARTS.flatMap((part) => {
    const citation = ref[part];
    return citation === null
      ? []
      : [
          {
            part,
            label: CZECH_TEXTS[part].label,
            citation,
            href: czechHref(part, citation),
          },
        ];
  });

/**
 * The one-line source under a duty: the first place in each text, Act first, because `act` holds
 * only sections where the Act sets the duty itself (reporting, suppliers, registration), then each
 * decree for its regime. "§§ 15 až 17 zákona č. 264/2025 Sb.; § 10 písm. b) vyhlášky č. 410/2025
 * Sb.; § 14 odst. 1 písm. j) vyhlášky č. 409/2025 Sb." Linked to the first.
 */
export const czechDutyCitation = (
  ref: CzechRef | null,
): { readonly cite: string; readonly href: string } | null => {
  if (ref === null) return null;
  const cited = czechCitations(ref);
  const first = cited[0];
  if (first === undefined) return null;
  return {
    cite: cited
      .map((c) => `${c.citation.split("; ")[0]} ${CZECH_TEXTS[c.part].genitive}`)
      .join("; "),
    href: first.href,
  };
};

/**
 * § 16 of the Act: the reports on a cyber security incident, the Czech counterpart of § 32 BSIG.
 * The first two run from when the incident is found ("po zjištění"), the final report from the
 * day the oznámení was submitted (odst. 3 písm. c)). The oznámení and the final report are owed
 * only for an incident with a significant impact: on the service in the lower regime (§ 15
 * odst. 2), on the state's cyberspace as NÚKIB tells a higher-regime provider within 24 hours
 * (§ 16 odst. 2). The Czech Act keeps the steps of § 32 BSIG, so the German keys name them.
 */
export const CZECH_REPORTING_CLOCK = {
  /** Odst. 1, prvotní hlášení. */
  initialReportHours: 24,
  /** Odst. 3 písm. a), oznámení. */
  notificationHours: 72,
  /** Odst. 3 písm. c), závěrečná zpráva. */
  finalReportDays: 30,
} as const;

/** What each report is called and holds, in the Act's words (§ 16 odst. 1 and 3). */
export const CZECH_REPORT_TEXT: Readonly<Record<Report, ReportText>> = {
  early_warning: {
    name: "Prvotní hlášení",
    content:
      "Identifikační údaje, základní údaje o incidentu a zda se domníváte, že byl způsoben nezákonným zásahem nebo že by mohl mít přeshraniční dopad.",
  },
  notification: {
    name: "Oznámení",
    content:
      "Aktualizuje prvotní hlášení, přináší prvotní posouzení incidentu a uvádí jeho dopad a indikátory kompromitace, pokud jsou k dispozici.",
  },
  final_report: {
    name: "Závěrečná zpráva",
    content:
      "Zpráva o vyřešení incidentu. Trvá-li incident ještě po uplynutí lhůty, podává se průběžná zpráva a závěrečná zpráva pak do 30 dnů ode dne vyřešení.",
  },
};

/**
 * § 59 odst. 4 of the Act: the fine caps, whichever of the amount and the share of turnover is
 * higher. Písm. a) is the higher regime's (offences under odst. 1), písm. b) the lower regime's
 * (odst. 2). Keyed by the directive's tier the applicability check finds: an essential entity is
 * taken to be in the higher regime, an important one in the lower. NÚKIB sets the regimes (§ 8
 * odst. 2, vyhláška č. 408/2025 Sb.), so for a company this is an estimate.
 */
export const CZECH_PENALTY_CEILING: Readonly<
  Record<PenaltyTier, { readonly amount: string; readonly turnoverPercent: string }>
> = {
  essential: { amount: "250 mil. Kč", turnoverPercent: "2 %" },
  important: { amount: "175 mil. Kč", turnoverPercent: "1,4 %" },
};

/**
 * A directive citation as Czech writes it: "Art. 21(2)(a)" becomes "čl. 21 odst. 2 písm. a)",
 * "Art. 3(1)-(2)" becomes "čl. 3 odst. 1 až 2". Free text, so patterns.
 */
export const czechArticle = (text: string): string =>
  text
    .replace(/Art\.\s*(\d+)\((\d+)\)-\((\d+)\)/g, "čl. $1 odst. $2 až $3")
    .replace(/Art\.\s*(\d+)\((\d+)\)\(([a-z]+)\)/g, "čl. $1 odst. $2 písm. $3)")
    .replace(/Art\.\s*(\d+)\((\d+)\)/g, "čl. $1 odst. $2")
    .replace(/Art\.\s*(\d+)/g, "čl. $1");

/**
 * The Act and the four decrees a Czech page cites by number: 264 the Act, 334 the Portál NÚKIB
 * and registration data, 408 the regulated services, 409 and 410 the measures. All 2025, all in
 * force in e-Sbírka's version of 1 November 2025.
 */
const CZECH_TEXT_MENTION = /(?:(\p{L}+)\s+)?č\.\s*(264|334|408|409|410)\/2025\s*Sb\./u;

/** A name in the nominative ("vyhláška č. 410/2025 Sb., § 4") has its sections after it. */
const NOMINATIVE = new Set(["zákon", "vyhláška"]);

const SECTION = /§§?\s*(\d+)/gu;

const sectionsIn = (text: string): readonly string[] =>
  Array.from(text.matchAll(SECTION), (match) => match[1]).filter(
    (section): section is string => section !== undefined,
  );

const esbHref = (number: string, section: string | null): string =>
  `https://e-sbirka.gov.cz/sb/2025/${number}/${ESB_VERSION}${section === null ? "" : `#par_${section}`}`;

/**
 * Where one clause of a citation points: the Czech text it names, at the section next to that
 * name. The genitive ("§ 13 odst. 2 zákona č. 264/2025 Sb.") has its section before the name, so
 * the nearest one before it, which skips another law's section earlier in the clause ("§ 159
 * občanského zákoníku, § 58 zákona …"); the nominative has it after. No section: the whole text.
 */
const clauseHref = (clause: string): string | null => {
  const mention = CZECH_TEXT_MENTION.exec(clause);
  const number = mention?.[2];
  if (mention === null || number === undefined) return null;
  const before = clause.slice(0, mention.index);
  const after = clause.slice(mention.index + mention[0].length);
  const section = NOMINATIVE.has(mention[1] ?? "")
    ? (sectionsIn(after)[0] ?? null)
    : (sectionsIn(before).at(-1) ?? null);
  return esbHref(number, section);
};

/**
 * The e-Sbírka address of the first Czech provision a citation names, null where it names none
 * (a BSIG or EU-only citation). Clauses are split at ";" and "·", the separators our citations
 * use between laws. Free text, so patterns.
 */
export const czechProvisionHref = (citation: string): string | null =>
  citation
    .split(/[;·]/)
    .map(clauseHref)
    .find((href) => href !== null) ?? null;
