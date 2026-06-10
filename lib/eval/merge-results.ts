import type {
  PersonaEvaluation,
  FieldEvaluation,
  MergedField,
  MergedCoverage,
  MergedDataIssue,
  MergedCategoryEvaluation,
  PersonaSummary,
  Severity,
  FieldStatus,
  Verdict,
} from "./panel-schema";
import type { RunPersonaResult } from "./run-persona";

const SEVERITY_RANK: Record<Severity, number> = {
  "critical": 0,
  "important": 1,
  "nice-to-have": 2,
};

const STATUS_RANK: Record<FieldStatus, number> = {
  "missing": 0,
  "needs-improvement": 1,
  "existing": 2,
};

function worstSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] <= SEVERITY_RANK[b] ? a : b;
}

function worstStatus(a: FieldStatus, b: FieldStatus): FieldStatus {
  return STATUS_RANK[a] <= STATUS_RANK[b] ? a : b;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_\s]/g, "");
}

/**
 * Group fields by fieldKey (exact match first, then normalized match).
 * For same-expectation but different keys, group by auditExpectation.
 */
function mergeFields(
  results: RunPersonaResult[],
): MergedField[] {
  // First pass: group by normalized fieldKey
  const byKey = new Map<string, Array<{ personaId: string; field: FieldEvaluation }>>();

  for (const result of results) {
    for (const field of result.evaluation.fields) {
      const nk = normalizeKey(field.fieldKey);
      const group = byKey.get(nk) ?? [];
      group.push({ personaId: result.personaId, field });
      byKey.set(nk, group);
    }
  }

  // Second pass: merge overlapping audit expectations for different keys
  const byExpectation = new Map<string, string[]>();
  for (const [nk, entries] of byKey) {
    for (const entry of entries) {
      const ne = normalizeKey(entry.field.auditExpectation);
      const keys = byExpectation.get(ne) ?? [];
      if (!keys.includes(nk)) keys.push(nk);
      byExpectation.set(ne, keys);
    }
  }

  // Merge groups that share the same audit expectation AND have different keys
  // Only merge if all keys in the group are from different personas (avoid merging distinct fields)
  const mergedKeys = new Map<string, string>(); // normalizedKey → canonical normalizedKey
  for (const [, keys] of byExpectation) {
    if (keys.length <= 1) continue;

    // Find the key with the most entries (most personas agree on it)
    let bestKey = keys[0];
    let bestCount = byKey.get(keys[0])?.length ?? 0;
    for (const k of keys.slice(1)) {
      const count = byKey.get(k)?.length ?? 0;
      if (count > bestCount) {
        bestKey = k;
        bestCount = count;
      }
    }

    // Map other keys to canonical only if they have no overlap in persona IDs
    const canonicalPersonas = new Set(byKey.get(bestKey)?.map((e) => e.personaId) ?? []);
    for (const k of keys) {
      if (k === bestKey) continue;
      const otherPersonas = byKey.get(k)?.map((e) => e.personaId) ?? [];
      const hasOverlap = otherPersonas.some((p) => canonicalPersonas.has(p));
      if (!hasOverlap) {
        mergedKeys.set(k, bestKey);
      }
    }
  }

  // Apply expectation-based merges
  for (const [fromKey, toKey] of mergedKeys) {
    const fromEntries = byKey.get(fromKey);
    if (!fromEntries) continue;
    const toEntries = byKey.get(toKey) ?? [];
    toEntries.push(...fromEntries);
    byKey.set(toKey, toEntries);
    byKey.delete(fromKey);
  }

  // Third pass: requirement-prefix clustering
  // Keys like "gov002_oversightreport" and "gov002_managementreport" share prefix "gov002"
  // Merge if from different personas (no overlap)
  const byPrefix = new Map<string, string[]>();
  for (const nk of byKey.keys()) {
    const match = nk.match(/^([a-z]{3}\d{3})/);
    if (!match) continue;
    const prefix = match[1];
    const keys = byPrefix.get(prefix) ?? [];
    keys.push(nk);
    byPrefix.set(prefix, keys);
  }

  for (const [, keys] of byPrefix) {
    if (keys.length <= 1) continue;

    // Find key with most persona entries
    let bestKey = keys[0];
    let bestCount = byKey.get(keys[0])?.length ?? 0;
    for (const k of keys.slice(1)) {
      const count = byKey.get(k)?.length ?? 0;
      if (count > bestCount) {
        bestKey = k;
        bestCount = count;
      }
    }

    const canonicalPersonas = new Set(byKey.get(bestKey)?.map((e) => e.personaId) ?? []);
    for (const k of keys) {
      if (k === bestKey) continue;
      const otherPersonas = byKey.get(k)?.map((e) => e.personaId) ?? [];
      const hasOverlap = otherPersonas.some((p) => canonicalPersonas.has(p));
      if (!hasOverlap) {
        const fromEntries = byKey.get(k);
        if (!fromEntries) continue;
        const toEntries = byKey.get(bestKey) ?? [];
        toEntries.push(...fromEntries);
        byKey.set(bestKey, toEntries);
        byKey.delete(k);
        // Add merged personas to canonical set to prevent triple-merge
        for (const e of fromEntries) {
          canonicalPersonas.add(e.personaId);
        }
      }
    }
  }

  // Build merged fields
  const merged: MergedField[] = [];

  for (const [, entries] of byKey) {
    // Take worst severity, worst status, union flaggedBy
    let severity: Severity = "nice-to-have";
    let status: FieldStatus = "existing";
    const flaggedBy: string[] = [];
    let bestEntry = entries[0];

    for (const entry of entries) {
      severity = worstSeverity(severity, entry.field.severity);
      status = worstStatus(status, entry.field.status);
      if (!flaggedBy.includes(entry.personaId)) {
        flaggedBy.push(entry.personaId);
      }
      // Rationale from highest-severity persona
      if (SEVERITY_RANK[entry.field.severity] < SEVERITY_RANK[bestEntry.field.severity]) {
        bestEntry = entry;
      }
    }

    // Collect all suggested options
    const allOptions = entries
      .flatMap((e) => e.field.suggestedOptions ?? [])
      .filter((v, i, a) => a.indexOf(v) === i);

    // Collect improvement notes
    const improvementNotes = entries
      .map((e) => e.field.improvementNote)
      .filter((n): n is string => n !== undefined && n !== "");

    merged.push({
      fieldKey: bestEntry.field.fieldKey,
      fieldType: bestEntry.field.fieldType,
      label: bestEntry.field.label,
      status,
      severity,
      rationale: bestEntry.field.rationale,
      auditExpectation: bestEntry.field.auditExpectation,
      ...(allOptions.length > 0 ? { suggestedOptions: allOptions } : {}),
      ...(improvementNotes.length > 0 ? { improvementNote: improvementNotes.join("; ") } : {}),
      flaggedBy,
    });
  }

  // Sort: missing first, then needs-improvement, then existing; within each, by severity
  merged.sort((a, b) => {
    const statusDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (statusDiff !== 0) return statusDiff;
    return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  });

  return merged;
}

/**
 * Merge coverage assessments across personas using majority vote.
 * Groups by expectationIndex (stable integer) instead of text matching.
 */
function mergeCoverage(results: RunPersonaResult[]): MergedCoverage[] {
  const byIndex = new Map<number, Array<{ personaId: string; item: PersonaEvaluation["coverage"][number] }>>();

  for (const result of results) {
    for (const item of result.evaluation.coverage) {
      const idx = item.expectationIndex;
      const group = byIndex.get(idx) ?? [];
      group.push({ personaId: result.personaId, item });
      byIndex.set(idx, group);
    }
  }

  const merged: MergedCoverage[] = [];

  for (const [idx, entries] of byIndex) {
    const coveredCount = entries.filter((e) => e.item.covered).length;
    const covered = coveredCount >= 3; // Majority vote: 3+ of 5

    // Union covering fields
    const coveringFields = entries
      .flatMap((e) => e.item.coveringFields)
      .filter((v, i, a) => a.indexOf(v) === i);

    // Gap from first persona that flagged it
    const gapEntry = entries.find((e) => !e.item.covered && e.item.gap);

    merged.push({
      expectationIndex: idx,
      expectation: entries[0].item.expectation,
      covered,
      coveringFields,
      ...(gapEntry?.item.gap ? { gap: gapEntry.item.gap } : {}),
      consensusLevel: coveredCount,
    });
  }

  // Sort by expectation index for stable ordering
  merged.sort((a, b) => a.expectationIndex - b.expectationIndex);

  return merged;
}

/**
 * Merge data issues across personas, deduplicating by requirementCode + fieldKey.
 */
function mergeDataIssues(results: RunPersonaResult[]): MergedDataIssue[] {
  const byKey = new Map<string, Array<{ personaId: string; issue: PersonaEvaluation["dataIssues"][number] }>>();

  for (const result of results) {
    for (const issue of result.evaluation.dataIssues) {
      const key = `${issue.requirementCode}::${normalizeKey(issue.fieldKey)}`;
      const group = byKey.get(key) ?? [];
      group.push({ personaId: result.personaId, issue });
      byKey.set(key, group);
    }
  }

  const merged: MergedDataIssue[] = [];

  for (const [, entries] of byKey) {
    let severity: Severity = "nice-to-have";
    const flaggedBy: string[] = [];
    let bestEntry = entries[0];

    for (const entry of entries) {
      severity = worstSeverity(severity, entry.issue.severity);
      if (!flaggedBy.includes(entry.personaId)) {
        flaggedBy.push(entry.personaId);
      }
      if (SEVERITY_RANK[entry.issue.severity] < SEVERITY_RANK[bestEntry.issue.severity]) {
        bestEntry = entry;
      }
    }

    merged.push({
      requirementCode: bestEntry.issue.requirementCode,
      fieldKey: bestEntry.issue.fieldKey,
      issue: bestEntry.issue.issue,
      recommendation: bestEntry.issue.recommendation,
      severity,
      flaggedBy,
    });
  }

  // Sort by severity
  merged.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  return merged;
}

/**
 * Merge recommendations from all personas, ranked by frequency.
 */
function mergeRecommendations(
  results: RunPersonaResult[],
): Array<{ text: string; frequency: number }> {
  // Count frequency by normalized text (first 80 chars for dedup)
  const byText = new Map<string, { text: string; count: number }>();

  for (const result of results) {
    for (const rec of result.evaluation.topRecommendations) {
      const nk = normalizeKey(rec.slice(0, 80));
      const existing = byText.get(nk);
      if (existing) {
        existing.count++;
      } else {
        byText.set(nk, { text: rec, count: 1 });
      }
    }
  }

  return Array.from(byText.values())
    .map((v) => ({ text: v.text, frequency: v.count }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Compute overall score from persona scores.
 * Average of 5 scores, with floor rule: if any persona < 40, cap at 60.
 */
function computeOverallScore(scores: number[]): number {
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const hasLowScore = scores.some((s) => s < 40);
  return hasLowScore ? Math.min(avg, 60) : avg;
}

function scoreToVerdict(score: number): Verdict {
  if (score >= 80) return "pass";
  if (score >= 50) return "partial";
  return "fail";
}

export function mergePersonaResults(
  categoryCode: string,
  categoryName: string,
  results: RunPersonaResult[],
): MergedCategoryEvaluation {
  const fields = mergeFields(results);
  const coverage = mergeCoverage(results);
  const dataIssues = mergeDataIssues(results);
  const mergedRecommendations = mergeRecommendations(results);

  const scores = results.map((r) => r.evaluation.score);
  const overallScore = computeOverallScore(scores);
  const overallVerdict = scoreToVerdict(overallScore);

  const personaSummaries: PersonaSummary[] = results.map((r) => ({
    personaId: r.personaId,
    personaName: r.personaName,
    score: r.evaluation.score,
    verdict: r.evaluation.verdict,
    summary: r.evaluation.summary,
  }));

  return {
    categoryCode,
    categoryName,
    fields,
    coverage,
    dataIssues,
    overallScore,
    overallVerdict,
    personaSummaries,
    mergedRecommendations,
  };
}
