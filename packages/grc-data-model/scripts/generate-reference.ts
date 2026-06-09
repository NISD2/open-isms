/**
 * Generate REFERENCE.md from package data.
 *
 * Run from the package root: bun run docs:reference
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  nis2Categories,
  getNis2RequirementsForCategory,
  gdprCategories,
  getGdprRequirementsForCategory,
} from "../src/frameworks";
import { nis2GdprSatisfactionPairs } from "../src/satisfaction-pairs";
import { nis2GdprMapping } from "../src/mappings/nis2-gdpr";

function escapeMd(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function buildReference(): string {
  const lines: string[] = [];

  lines.push("# NIS2 + GDPR Reference");
  lines.push("");
  lines.push("Generated from `@nisd2/grc-data-model` — the canonical EU NIS2 + GDPR data model.");
  lines.push("Browse the structure of every requirement, every category, and every cross-framework satisfaction pair.");
  lines.push("");
  lines.push("**This file is auto-generated.** Edit the source data in `src/frameworks/` and `src/satisfaction-pairs.ts`, then run `bun run docs:reference`.");
  lines.push("");
  lines.push("## Contents");
  lines.push("");
  lines.push("- [NIS2 Categories & Requirements](#nis2-categories--requirements)");
  lines.push("- [GDPR Categories & Requirements](#gdpr-categories--requirements)");
  lines.push("- [Cross-Framework Satisfaction Pairs](#cross-framework-satisfaction-pairs)");
  lines.push("- [Article-Level Mapping](#article-level-mapping)");
  lines.push("- [Coverage Summary](#coverage-summary)");
  lines.push("");

  // Build a code → GDPR sibling map for quick lookup
  const gdprSiblings = new Map<string, string[]>();
  const nis2Siblings = new Map<string, string[]>();
  for (const [a, b] of nis2GdprSatisfactionPairs) {
    if (!gdprSiblings.has(a)) gdprSiblings.set(a, []);
    gdprSiblings.get(a)!.push(b);
    if (!nis2Siblings.has(b)) nis2Siblings.set(b, []);
    nis2Siblings.get(b)!.push(a);
  }

  // ---------- NIS2 ----------
  lines.push("## NIS2 Categories & Requirements");
  lines.push("");
  lines.push("12 categories, 49 requirements. Sourced from BSIG (German NIS2 transposition) and CIR 2024/2690 (EU implementing regulation).");
  lines.push("");

  const sortedNis2 = [...nis2Categories].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const cat of sortedNis2) {
    lines.push(`### ${cat.code} — ${cat.slug}`);
    lines.push("");
    if (cat.grundschutzModule) {
      lines.push(`BSI IT-Grundschutz module: \`${cat.grundschutzModule}\`. Estimated effort: ${cat.estimatedMinutes} minutes.`);
      lines.push("");
    }
    const reqs = getNis2RequirementsForCategory(cat.slug);
    if (reqs.length === 0) {
      lines.push("_(no requirements seeded)_");
      lines.push("");
      continue;
    }
    lines.push("| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |");
    lines.push("|---|---|---|---|---|---|---|");
    for (const r of reqs) {
      const sibling = gdprSiblings.get(r.code)?.join(", ") ?? "—";
      lines.push(`| \`${r.code}\` | ${r.evidenceType} | ${r.priority} | ${r.frequency} | ${escapeMd(r.frameworkRef ?? "—")} | ${escapeMd(r.legalRef || "—")} | ${sibling} |`);
    }
    lines.push("");
  }

  // ---------- GDPR ----------
  lines.push("## GDPR Categories & Requirements");
  lines.push("");
  lines.push("5 categories, 7 requirements. Sourced from GDPR (EU 2016/679).");
  lines.push("");

  const sortedGdpr = [...gdprCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const cat of sortedGdpr) {
    lines.push(`### ${cat.code} — ${cat.slug}`);
    lines.push("");
    const reqs = getGdprRequirementsForCategory(cat.slug);
    if (reqs.length === 0) {
      lines.push("_(no requirements seeded)_");
      lines.push("");
      continue;
    }
    lines.push("| Code | Evidence | Priority | Article | Legal ref | NIS2 sibling |");
    lines.push("|---|---|---|---|---|---|");
    for (const r of reqs) {
      const sibling = nis2Siblings.get(r.code)?.join(", ") ?? "—";
      lines.push(`| \`${r.code}\` | ${r.evidenceType} | ${r.priority} | ${escapeMd(r.frameworkRef ?? "—")} | ${escapeMd(r.legalRef || "—")} | ${sibling} |`);
    }
    lines.push("");
  }

  // ---------- Satisfaction Pairs ----------
  lines.push("## Cross-Framework Satisfaction Pairs");
  lines.push("");
  lines.push(`${nis2GdprSatisfactionPairs.length} bidirectional pairs. Signing one requirement marks its linked sibling complete because the same operational evidence supports both attestations.`);
  lines.push("");
  lines.push("| NIS2 | GDPR | Rationale |");
  lines.push("|---|---|---|");
  for (const [a, b, rationale] of nis2GdprSatisfactionPairs) {
    lines.push(`| \`${a}\` | \`${b}\` | ${escapeMd(rationale)} |`);
  }
  lines.push("");

  // ---------- Article-level Mapping ----------
  lines.push("## Article-Level Mapping");
  lines.push("");
  lines.push(`${nis2GdprMapping.length} concept-level mappings between NIS2 articles and GDPR articles. Sources: ENISA NIS2 Technical Implementation Guidance v1.0; EDPB guidelines.`);
  lines.push("");
  lines.push("| NIS2 Article | GDPR Article | Concept | Link Type | Notes |");
  lines.push("|---|---|---|---|---|");
  for (const row of nis2GdprMapping) {
    lines.push(`| ${escapeMd(row.nis2Article)} | ${escapeMd(row.gdprArticle)} | ${escapeMd(row.concept)} | ${row.linkType} | ${escapeMd(row.notes ?? "—")} |`);
  }
  lines.push("");

  // ---------- Coverage Summary ----------
  let nis2Total = 0;
  for (const cat of nis2Categories) nis2Total += getNis2RequirementsForCategory(cat.slug).length;
  let gdprTotal = 0;
  for (const cat of gdprCategories) gdprTotal += getGdprRequirementsForCategory(cat.slug).length;

  lines.push("## Coverage Summary");
  lines.push("");
  lines.push("| | Categories | Requirements |");
  lines.push("|---|---|---|");
  lines.push(`| NIS2 | ${nis2Categories.length} | ${nis2Total} |`);
  lines.push(`| GDPR | ${gdprCategories.length} | ${gdprTotal} |`);
  lines.push("");
  lines.push(`**Total satisfaction pairs:** ${nis2GdprSatisfactionPairs.length} bidirectional (NIS2 ↔ GDPR).`);
  lines.push(`**Article-level mappings:** ${nis2GdprMapping.length} concept-level rows.`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("Maintained by [nisd2.eu](https://www.nisd2.eu). Issues and contributions welcome — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).");
  lines.push("");

  return lines.join("\n");
}

const out = join(__dirname, "..", "REFERENCE.md");
writeFileSync(out, buildReference());
console.log(`Wrote ${out}`);
