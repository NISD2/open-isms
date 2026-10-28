/**
 * Whether the company's backups can bring its critical processes back in time: the comparison
 * BSI-Standard 200-4 asks for at its entry level (p. 196: an estimate is enough and "unknown" is
 * an answer; p. 198: management confirms the list of what is too slow), for § 30 Abs. 2 Nr. 3
 * BSIG. Pure: the server reads the rows, this decides. Every verdict rests on a fact the company
 * recorded, never a guess, and an unknown restore time is a gap on the list, not a block.
 */
import { OUTAGE_SPANS, type OutageSpan } from "@nisd2/grc-data-model/enums";

/** A business process on the company's list, with how long it may be down at most (4.2). */
export interface ContinuityProcess {
  readonly id: string;
  readonly name: string;
  readonly maxOutage: OutageSpan | null;
}

/** A system or room a process needs, with how long a restore from it takes (4.4). */
export interface ContinuitySystem {
  readonly id: string;
  readonly name: string;
  readonly restoreTime: OutageSpan | null;
  readonly restoreTimeUnknown: boolean;
}

/** One process_asset row: this process needs that system. */
export interface ContinuityLink {
  readonly processId: string;
  readonly assetId: string;
}

export interface ContinuityFacts {
  readonly processes: readonly ContinuityProcess[];
  readonly systems: readonly ContinuitySystem[];
  readonly links: readonly ContinuityLink[];
}

/** The position on the one scale, shortest first; the comparison is on this. */
export const spanRank = (span: OutageSpan): number => OUTAGE_SPANS.indexOf(span);

const shorter = (a: OutageSpan, b: OutageSpan): OutageSpan =>
  spanRank(a) <= spanRank(b) ? a : b;

/** The processes that need a system, by name, in the order of the company's list. */
const needing = (facts: ContinuityFacts, assetId: string): readonly ContinuityProcess[] =>
  facts.processes.filter((p) =>
    facts.links.some((l) => l.assetId === assetId && l.processId === p.id),
  );

/**
 * How long a system may be down: the shortest tolerance of the processes that need it (a system
 * two processes share takes the shorter time, 200-4 p. 188). Null when none of them has one yet.
 */
export const requiredOutage = (
  facts: ContinuityFacts,
  assetId: string,
): OutageSpan | null =>
  needing(facts, assetId).reduce<OutageSpan | null>(
    (shortest, p) =>
      p.maxOutage === null
        ? shortest
        : shortest === null
          ? p.maxOutage
          : shorter(shortest, p.maxOutage),
    null,
  );

/** Where a system stands against the processes that need it. */
export type SystemVerdict =
  /** No critical process needs it: nothing to compare. */
  | { readonly kind: "not_needed" }
  /** Needed, but none of the processes that need it has a tolerance yet: 4.2 first. */
  | { readonly kind: "unrated"; readonly needs: readonly string[] }
  /** Needed and nobody knows how long a restore takes: a gap, by the standard's own rule. */
  | {
      readonly kind: "unknown";
      readonly required: OutageSpan;
      readonly needs: readonly string[];
    }
  /** Needed and the restore time not answered yet: 4.4 first. */
  | {
      readonly kind: "not_asked";
      readonly required: OutageSpan;
      readonly needs: readonly string[];
    }
  /** Needed and back in time. */
  | {
      readonly kind: "ok";
      readonly required: OutageSpan;
      readonly restore: OutageSpan;
      readonly needs: readonly string[];
    }
  /** Needed and the restore takes longer than the processes can wait: a gap. */
  | {
      readonly kind: "too_slow";
      readonly required: OutageSpan;
      readonly restore: OutageSpan;
      readonly needs: readonly string[];
    };

export interface SystemStanding {
  readonly system: ContinuitySystem;
  readonly verdict: SystemVerdict;
}

const verdictOf = (facts: ContinuityFacts, system: ContinuitySystem): SystemVerdict => {
  const needs = needing(facts, system.id).map((p) => p.name);
  if (needs.length === 0) return { kind: "not_needed" };
  const required = requiredOutage(facts, system.id);
  if (required === null) return { kind: "unrated", needs };
  if (system.restoreTimeUnknown) return { kind: "unknown", required, needs };
  if (system.restoreTime === null) return { kind: "not_asked", required, needs };
  return spanRank(system.restoreTime) > spanRank(required)
    ? { kind: "too_slow", required, restore: system.restoreTime, needs }
    : { kind: "ok", required, restore: system.restoreTime, needs };
};

/** Every system on the list against the processes that need it, in the order of the list. */
export const compare = (facts: ContinuityFacts): readonly SystemStanding[] =>
  facts.systems.map((system) => ({ system, verdict: verdictOf(facts, system) }));

/** What management sees before it signs: the systems too slow or unknown (200-4 p. 198). */
export const continuityGaps = (facts: ContinuityFacts): readonly SystemStanding[] =>
  compare(facts).filter(
    (s) => s.verdict.kind === "too_slow" || s.verdict.kind === "unknown",
  );

/**
 * The processes that must keep running without a tolerance yet: nothing they need can be
 * compared, so they are a gap of their own (4.2 first), never a silent "in time".
 */
export const unratedProcesses = (facts: ContinuityFacts): readonly ContinuityProcess[] =>
  facts.processes.filter((p) => p.maxOutage === null);
