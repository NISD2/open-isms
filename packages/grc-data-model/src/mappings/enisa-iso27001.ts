/**
 * The ISO/IEC 27001:2022 column of ENISA's mapping table for Implementing Regulation (EU)
 * 2024/2690: for each point of the Regulation's Annex, the clauses and Annex A controls ENISA lists
 * as relevant to it.
 *
 * Source: ENISA, Technical Implementation Guidance on Implementing Regulation (EU) 2024/2690,
 * mapping table version 1.2 (21.08.2025),
 * https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance, licensed under
 * CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Workbook SHA-256
 * b34ce42c46bd643dd3e5bc4aa03c2704fa006fc798946e36753914521d2be59b.
 *
 * Our changes: only this column is taken; spaces are removed, and a Greek capital alpha or a
 * missing dot ("A5.7") is written as "A.5.7". Nothing is added or dropped. ENISA lists "5.28" under
 * 10.4, which names no clause of the standard; it stays as listed and links nothing.
 *
 * ENISA on the table: it "should not be interpreted as a measure of equivalency". So every link
 * taken from it is an overlap, and none carries a signature across.
 */

export const ENISA_MAPPING_VERSION = "1.2";

export const ENISA_ISO27001_BY_CIR_POINT: Readonly<Record<string, readonly string[]>> = {
  "1.1": ["5.2", "A.5.1", "A.5.36", "A.5.4", "9.3"],
  "1.2": ["5.3", "A.5.2", "A.5.3", "A.5.4"],
  "2.1": [
    "6.1",
    "6.1.2",
    "6.1.3",
    "6.2",
    "8.2",
    "8.3",
    "A.5.7",
    "A.5.19",
    "A.5.20",
    "A.5.21",
  ],
  "2.2": ["9.2", "A.5.31", "A.5.35", "A.5.36"],
  "2.3": ["9.2", "10.1", "A.5.35", "A.8.34"],
  "3.1": ["A.5.24"],
  "3.2": ["A.5.28", "A.8.15", "A.8.16", "A.8.17"],
  "3.3": ["A.6.8"],
  "3.4": ["A.5.25"],
  "3.5": ["A.5.26"],
  "3.6": ["A.5.27"],
  "4.1": ["A.5.29", "A.5.30"],
  "4.2": ["A.8.13", "A.8.14"],
  "4.3": ["A.5.26", "A.5.29", "A.5.30"],
  "5.1": ["A.5.19", "A.5.20", "A.5.21", "A.8.30"],
  "5.2": ["A.5.22"],
  "6.1": ["A.5.21", "A.5.23"],
  "6.2": ["A.8.25", "A.8.31"],
  "6.3": ["A.8.9"],
  "6.4": ["6.3", "8.1", "A.7.13", "A.8.32"],
  "6.5": ["A.8.29", "A.8.33", "A.8.34"],
  "6.6": ["A.8.31", "A.8.32"],
  "6.7": ["A.8.16", "A.8.20"],
  "6.8": ["A.8.22"],
  "6.9": ["A.5.32", "A.8.7"],
  "6.10": ["A.8.8"],
  "7.1": ["6.2", "9.1", "9.3"],
  "8.1": ["7.3", "A.6.3", "A.8.7"],
  "8.2": ["7.2", "A.6.3"],
  "9.1": ["A.5.31", "A.8.24"],
  "10.1": ["7.1", "7.2", "A.6.2", "A.6.3"],
  "10.2": ["A.6.1"],
  "10.3": ["A.6.5"],
  "10.4": ["5.28", "A.6.4"],
  "11.1": ["A.5.15", "A.7.2", "A.8.3", "A.8.21"],
  "11.2": ["A.5.3", "A.5.18"],
  "11.3": ["A.8.2", "A.8.18"],
  "11.4": ["A.8.2", "A.8.18"],
  "11.5": ["A.5.16"],
  "11.6": ["A.5.17"],
  "11.7": ["A.8.5"],
  "12.1": ["A.5.9", "A.5.12", "A.5.13"],
  "12.2": ["A.5.9", "A.5.10", "A.5.14", "A.7.10"],
  "12.3": ["A.7.7", "A.7.10"],
  "12.4": ["A.5.9"],
  "12.5": ["A.5.11", "A.5.18", "A.8.24"],
  "13.1": ["A.7.11"],
  "13.2": ["A.7.3", "A.7.5"],
  "13.3": ["A.7.1", "A.7.2", "A.7.4"],
};

/** The points a NIS2 item cites, at the depth ENISA maps: "1.1.1(e), 2.1" gives 1.1 and 2.1. */
export function cirPointsOf(cirReference: string | null): string[] {
  const points = (cirReference ?? "")
    .split(",")
    .map((part) => (part.trim().split("(")[0] ?? "").split(".").slice(0, 2).join("."))
    .filter((point) => point !== "");
  return [...new Set(points)];
}

/** Our code for a reference ENISA lists: a control as written, a clause as its item (6.1.2 is IS-6.1). */
export function isoCodeOf(reference: string): string {
  return reference.startsWith("A.")
    ? reference
    : `IS-${reference.split(".").slice(0, 2).join(".")}`;
}

export type EnisaPair = readonly [
  iso27001Code: string,
  nis2Code: string,
  rationale: string,
  kind: "overlapping",
];

/**
 * One overlap link for every ISO item ENISA lists against a point a NIS2 item cites, naming each
 * point and reference behind it. A reference that is no item in `isoCodes` links nothing.
 */
export function enisaIso27001Pairs(
  nis2: readonly { readonly code: string; readonly cirReference: string | null }[],
  isoCodes: ReadonlySet<string>,
): EnisaPair[] {
  const links = nis2.flatMap(({ code, cirReference }) =>
    cirPointsOf(cirReference).flatMap((point) =>
      (ENISA_ISO27001_BY_CIR_POINT[point] ?? [])
        .filter((reference) => isoCodes.has(isoCodeOf(reference)))
        .map((reference) => ({
          iso: isoCodeOf(reference),
          nis2: code,
          point,
          reference,
        })),
    ),
  );
  const byPair = links.reduce((pairs, link) => {
    const key = `${link.iso}|${link.nis2}`;
    return pairs.set(key, [...(pairs.get(key) ?? []), link]);
  }, new Map<string, (typeof links)[number][]>());
  return [...byPair.values()].flatMap((group) => {
    const [first] = group;
    return first
      ? [[first.iso, first.nis2, rationaleOf(group), "overlapping"] as const]
      : [];
  });
}

/** "ENISA mapping table v1.2 lists ISO 27001 6.1, 6.1.2 for CIR point 2.1: ..." */
function rationaleOf(group: readonly { point: string; reference: string }[]): string {
  const points = [...new Set(group.map(({ point }) => point))];
  const listed = points.map((point) => {
    const references = group
      .filter((link) => link.point === point)
      .map((link) => link.reference);
    return `${references.join(", ")} for CIR point ${point}`;
  });
  return `ENISA mapping table v${ENISA_MAPPING_VERSION} lists ISO 27001 ${listed.join("; ")}: a relevant reference, not the same record.`;
}
