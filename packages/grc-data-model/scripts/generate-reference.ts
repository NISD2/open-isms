/**
 * Generate REFERENCE.md from package data.
 *
 * Run from the package root: bun run docs:reference
 *
 * Every framework comes from FRAMEWORK_DATA and every link from allSatisfactionPairs, so a
 * framework or a pair added there appears here without touching this script, and every count is
 * computed rather than written down.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { FRAMEWORK_DATA, type FrameworkData } from "../src/frameworks";
import { nis2GdprMapping } from "../src/mappings/nis2-gdpr";
import { allSatisfactionPairs } from "../src/satisfaction-pairs";

function escapeMd(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

const anchor = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/ /g, "-");

const requirementsOf = (f: FrameworkData) =>
  f.categories.flatMap((c) => f.getRequirements(c.slug));

const frameworkOf = new Map(
  FRAMEWORK_DATA.flatMap((f) => requirementsOf(f).map((r) => [r.code, f] as const)),
);

/** Every code each requirement is linked to, in either direction. */
const linkedTo = new Map<string, string[]>();
for (const [a, b] of allSatisfactionPairs) {
  linkedTo.set(a, [...(linkedTo.get(a) ?? []), b]);
  linkedTo.set(b, [...(linkedTo.get(b) ?? []), a]);
}

function frameworkSection(f: FrameworkData): string[] {
  const requirements = requirementsOf(f);
  const sorted = [...f.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  return [
    `## ${f.name}`,
    "",
    `${f.categories.length} categories, ${requirements.length} requirements. Cites ${f.source}.`,
    "",
    ...sorted.flatMap((cat) => {
      const reqs = f.getRequirements(cat.slug);
      const module = cat.grundschutzModule
        ? [
            `BSI IT-Grundschutz module: \`${cat.grundschutzModule}\`. Estimated effort: ${cat.estimatedMinutes} minutes.`,
            "",
          ]
        : [];
      const body =
        reqs.length === 0
          ? ["_(no requirements seeded)_", ""]
          : [
              "| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |",
              "|---|---|---|---|---|---|---|",
              ...reqs.map(
                (r) =>
                  `| \`${r.code}\` | ${r.evidenceType} | ${r.priority} | ${r.frequency} | ${escapeMd(r.frameworkRef ?? "none")} | ${escapeMd(r.legalRef || "none")} | ${linkedTo.get(r.code)?.join(", ") ?? "none"} |`,
              ),
              "",
            ];
      return [`### ${cat.code}: ${cat.slug}`, "", ...module, ...body];
    }),
  ];
}

/** The pairs grouped by the two frameworks they link, in the order the pairs are listed. */
function pairGroups(): Map<string, typeof allSatisfactionPairs> {
  const groups = new Map<string, typeof allSatisfactionPairs>();
  for (const pair of allSatisfactionPairs) {
    const key = `${frameworkOf.get(pair[0])?.name ?? "?"} and ${frameworkOf.get(pair[1])?.name ?? "?"}`;
    groups.set(key, [...(groups.get(key) ?? []), pair]);
  }
  return groups;
}

function buildReference(): string {
  const groups = pairGroups();
  const pairHeading = "Cross-Framework Satisfaction Pairs";
  const mappingHeading = "Article-Level Mapping, NIS2 and GDPR";
  const summaryHeading = "Coverage Summary";
  return [
    "# Framework Reference",
    "",
    "Generated from `@nisd2/grc-data-model`: every category and requirement of each framework the package carries, and every link between requirements of two frameworks.",
    "",
    "**This file is auto-generated.** Edit the source data in `src/frameworks/` and `src/satisfaction-pairs.ts`, then run `bun run docs:reference`.",
    "",
    "## Contents",
    "",
    ...[
      ...FRAMEWORK_DATA.map((f) => f.name),
      pairHeading,
      mappingHeading,
      summaryHeading,
    ].map((h) => `- [${h}](#${anchor(h)})`),
    "",
    ...FRAMEWORK_DATA.flatMap(frameworkSection),
    `## ${pairHeading}`,
    "",
    `${allSatisfactionPairs.length} pairs. \`equivalent\` marks the same record in both frameworks; \`overlapping\` marks a partial overlap, where the other framework still asks for more.`,
    "",
    ...[...groups].flatMap(([key, pairs]) => [
      `### ${key} (${pairs.length})`,
      "",
      "| First | Second | Kind | Rationale |",
      "|---|---|---|---|",
      ...pairs.map(
        ([a, b, rationale, kind]) =>
          `| \`${a}\` | \`${b}\` | ${kind ?? "overlapping"} | ${escapeMd(rationale)} |`,
      ),
      "",
    ]),
    `## ${mappingHeading}`,
    "",
    `${nis2GdprMapping.length} concept-level mappings between NIS2 articles and GDPR articles.`,
    "",
    "| NIS2 Article | GDPR Article | Concept | Link Type | Notes |",
    "|---|---|---|---|---|",
    ...nis2GdprMapping.map(
      (row) =>
        `| ${escapeMd(row.nis2Article)} | ${escapeMd(row.gdprArticle)} | ${escapeMd(row.concept)} | ${row.linkType} | ${escapeMd(row.notes ?? "none")} |`,
    ),
    "",
    `## ${summaryHeading}`,
    "",
    "| | Categories | Requirements |",
    "|---|---|---|",
    ...FRAMEWORK_DATA.map(
      (f) => `| ${f.name} | ${f.categories.length} | ${requirementsOf(f).length} |`,
    ),
    "",
    `**Satisfaction pairs:** ${allSatisfactionPairs.length}, in ${groups.size} framework combinations.`,
    `**Article-level mappings:** ${nis2GdprMapping.length} concept-level rows.`,
    "",
    "---",
    "",
    "Maintained by [nisd2.eu](https://www.nisd2.eu). Issues and contributions welcome: see [`CONTRIBUTING.md`](./CONTRIBUTING.md).",
    "",
  ].join("\n");
}

const out = join(__dirname, "..", "REFERENCE.md");
writeFileSync(out, buildReference());
console.log(`Wrote ${out}`);
