import type {
  Answers,
  Axis,
  Domain,
  DomainResult,
  MatrixResult,
  Score,
  Tier,
} from "./types";
import { AXES, AXES_BY_DOMAIN, AXIS_BY_ID } from "./axes";

// scoring.ts is the pure scoring engine (algorithm only).
// Content lookups (Bausteine per tier, NIS2 Art 21(2) measures) live in
// recommendations.ts so the algorithm stays free of policy decisions.

// Domain sum thresholds derived from the four worked examples in the design doc
// (DOS workshop machine, Wix marketing site, internet-exposed coffee machine,
// Production ERP). Thresholds chosen so each example lands on the tier the
// design doc validates as correct intuition.
//
// security (4 axes, max sum 12): 0-3 basis, 4-7 standard, 8+ kern
// operational (2 axes, max sum 6): 0-1 basis, 2-4 standard, 5+ kern
// compliance (1 axis, max sum 3): 0-1 basis, 2 standard, 3 kern
const DOMAIN_TIER_THRESHOLDS: Record<
  Domain,
  { standard: number; kern: number }
> = {
  security: { standard: 4, kern: 8 },
  operational: { standard: 2, kern: 5 },
  compliance: { standard: 2, kern: 3 },
};

const TIER_RANK: Record<Tier, number> = {
  basis: 0,
  standard: 1,
  kern: 2,
};

export function maxTier(a: Tier, b: Tier): Tier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

function tierFromSum(domain: Domain, sum: number): Tier {
  const t = DOMAIN_TIER_THRESHOLDS[domain];
  if (sum >= t.kern) return "kern";
  if (sum >= t.standard) return "standard";
  return "basis";
}

function scoreFor(axis: Axis, answers: Answers): Score | null {
  const optionId = answers[axis.id];
  if (!optionId) return null;
  const option = axis.options.find((o) => o.id === optionId);
  return option ? option.score : null;
}

export function hasAllAnswers(answers: Answers): boolean {
  return AXES.every((axis) => scoreFor(axis, answers) !== null);
}

function evaluateDomain(domain: Domain, answers: Answers): DomainResult {
  const axes = AXES_BY_DOMAIN[domain] ?? [];
  let sum = 0;
  let hardStopMinTier: Tier = "basis";
  let hardStopTriggered = false;

  for (const axis of axes) {
    const score = scoreFor(axis, answers) ?? 0;
    sum += score;
    if (axis.hardStop && score === axis.hardStop.triggerScore) {
      hardStopMinTier = maxTier(hardStopMinTier, axis.hardStop.minTier);
      hardStopTriggered = true;
    }
  }

  const sumTier = tierFromSum(domain, sum);
  const tier = maxTier(sumTier, hardStopMinTier);

  return { domain, sum, tier, hardStopTriggered };
}

export function scoreMatrix(answers: Answers): MatrixResult {
  const domainResults: DomainResult[] = [
    evaluateDomain("security", answers),
    evaluateDomain("operational", answers),
    evaluateDomain("compliance", answers),
  ];

  let finalTier: Tier = "basis";
  let drivingDomain: Domain = "security";
  for (const result of domainResults) {
    if (TIER_RANK[result.tier] > TIER_RANK[finalTier]) {
      finalTier = result.tier;
      drivingDomain = result.domain;
    }
  }

  const axisScores = AXES.map((axis) => ({
    axisId: axis.id,
    optionId: answers[axis.id] ?? "",
    score: (scoreFor(axis, answers) ?? 0) as Score,
  }));

  return {
    finalTier,
    drivingDomain,
    domains: domainResults,
    axisScores,
  };
}

export function getAxisById(id: string): Axis | undefined {
  return AXIS_BY_ID.get(id);
}
