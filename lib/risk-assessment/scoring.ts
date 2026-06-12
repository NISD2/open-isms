import { AXES, AXIS_BY_ID, AXES_BY_PURPOSE } from "./axes";
import type {
  Absicherungsvariante,
  AbsicherungsvarianteRecommendation,
  Answers,
  Axis,
  GrundwertResult,
  MatrixResult,
  SchutzbedarfBreakdown,
  Schutzbedarf,
  Score,
} from "./types";

// scoring.ts is the pure scoring engine.
// Content lookups (Bausteine, Art 21(2) measures) live in recommendations.ts.

// Ordering for max-of comparisons.
const SCHUTZBEDARF_RANK: Record<Schutzbedarf, number> = {
  normal: 0,
  hoch: 1,
  sehrHoch: 2,
};

const VARIANTE_RANK: Record<Absicherungsvariante, number> = {
  basis: 0,
  standard: 1,
  kern: 2,
};

// Axis score → Schutzbedarf class for the per-Grundwert direct inputs.
// Threshold mapping: 0-1 → normal, 2 → hoch, 3 → sehr hoch.
// Each option label in the i18n bundle is written to read as one of
// these bands plus a finer middle tone (0 vs. 1 within "normal").
function scoreToSchutzbedarf(score: Score): Schutzbedarf {
  if (score >= 3) return "sehrHoch";
  if (score >= 2) return "hoch";
  return "normal";
}

function maxSchutzbedarf(a: Schutzbedarf, b: Schutzbedarf): Schutzbedarf {
  return SCHUTZBEDARF_RANK[a] >= SCHUTZBEDARF_RANK[b] ? a : b;
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

// Kumulationseffekt (BSI-200-2 §8.2.4): when many users / accesses
// aggregate on one asset, the Schutzbedarf can be lifted. We apply
// it conservatively to V only and only when V-base is already hoch —
// i.e., already-protection-worthy data accessed by many or external
// users elevates to sehr hoch. Pure normal-V data is not elevated by
// user count alone.
function applyKumulationToV(baseV: Schutzbedarf, userCountScore: Score): Schutzbedarf {
  if (baseV !== "hoch") return baseV;
  if (userCountScore >= 2) return "sehrHoch";
  return baseV;
}

function getAxisByPurposeAndGrundwert(grundwert: "v" | "i" | "a"): Axis {
  const axis = AXES_BY_PURPOSE["schutzbedarf"]?.find(
    (a) => a.grundwert === grundwert,
  );
  if (!axis) {
    throw new Error(`No schutzbedarf axis configured for Grundwert "${grundwert}"`);
  }
  return axis;
}

function getKumulationAxis(): Axis {
  const axis = AXES_BY_PURPOSE["kumulation"]?.[0];
  if (!axis) throw new Error("No kumulation axis configured");
  return axis;
}

// Compute V/I/A Schutzbedarf per Grundwert, then Maximum-Prinzip
// (BSI-200-2 §8.2.3) → Gesamt-Schutzbedarf.
function computeSchutzbedarf(answers: Answers): SchutzbedarfBreakdown {
  const vAxis = getAxisByPurposeAndGrundwert("v");
  const iAxis = getAxisByPurposeAndGrundwert("i");
  const aAxis = getAxisByPurposeAndGrundwert("a");
  const userCountAxis = getKumulationAxis();

  const vScore = (scoreFor(vAxis, answers) ?? 0) as Score;
  const iScore = (scoreFor(iAxis, answers) ?? 0) as Score;
  const aScore = (scoreFor(aAxis, answers) ?? 0) as Score;
  const userCountScore = (scoreFor(userCountAxis, answers) ?? 0) as Score;

  const baseV = scoreToSchutzbedarf(vScore);
  const finalV = applyKumulationToV(baseV, userCountScore);
  const finalI = scoreToSchutzbedarf(iScore);
  const finalA = scoreToSchutzbedarf(aScore);

  const vDrivers: string[] = [`${vAxis.id}:${answers[vAxis.id]}`];
  if (finalV !== baseV) {
    vDrivers.push(`${userCountAxis.id}:${answers[userCountAxis.id]}`);
  }
  const iDrivers = [`${iAxis.id}:${answers[iAxis.id]}`];
  const aDrivers = [`${aAxis.id}:${answers[aAxis.id]}`];

  const v: GrundwertResult = { class: finalV, drivers: vDrivers };
  const i: GrundwertResult = { class: finalI, drivers: iDrivers };
  const a: GrundwertResult = { class: finalA, drivers: aDrivers };

  // Maximum-Prinzip
  let gesamt: Schutzbedarf = finalV;
  let drivingGrundwert: "v" | "i" | "a" = "v";
  if (SCHUTZBEDARF_RANK[finalI] > SCHUTZBEDARF_RANK[gesamt]) {
    gesamt = finalI;
    drivingGrundwert = "i";
  }
  if (SCHUTZBEDARF_RANK[finalA] > SCHUTZBEDARF_RANK[gesamt]) {
    gesamt = finalA;
    drivingGrundwert = "a";
  }

  return { v, i, a, gesamt, drivingGrundwert };
}

// Map Gesamt-Schutzbedarf → recommended Absicherungsvariante.
//   normal   → Basis-Absicherung    (broad, shallow entry; no 200-3 needed)
//   hoch     → Standard-Absicherung (full Bausteine; 200-3 REQUIRED)
//   sehrHoch → Kern-Absicherung     (this asset is a Kronjuwel; 200-3 REQUIRED)
//
// This mapping is a practitioner heuristic, not BSI-prescribed verbatim.
// BSI allows organisations to choose Vorgehensweise freely; the heuristic
// follows the Lerneinheit 2.9 guidance for first-time orgs.
function varianteFromSchutzbedarf(s: Schutzbedarf): Absicherungsvariante {
  if (s === "sehrHoch") return "kern";
  if (s === "hoch") return "standard";
  return "basis";
}

// Hints can bump Basis → Standard ONLY. Hints don't bump beyond Standard:
// Kern is a scoping decision (which assets are Kronjuwelen), not an
// implementation-depth choice — and Schutzbedarf already determined
// whether this asset qualifies as a Kronjuwel.
function computeAbsicherungsvariante(
  schutzbedarf: SchutzbedarfBreakdown,
  answers: Answers,
): AbsicherungsvarianteRecommendation {
  const fromSchutzbedarf = varianteFromSchutzbedarf(schutzbedarf.gesamt);

  const hintAxes = AXES_BY_PURPOSE["hint"] ?? [];
  const bumpingHints = hintAxes
    .filter((axis) => (scoreFor(axis, answers) ?? 0) === 3)
    .map((axis) => axis.id);

  let final: Absicherungsvariante = fromSchutzbedarf;
  let bumpedByHints = false;
  if (fromSchutzbedarf === "basis" && bumpingHints.length > 0) {
    final = "standard";
    bumpedByHints = true;
  }

  // BSI-200-3 ergänzende Risikoanalyse: required when at least one
  // Grundwert reaches hoch or sehr hoch (BSI-200-3 §3 + BSI-200-2 §8.5).
  // Trigger on Gesamt because Gesamt = max of V/I/A.
  const risikoanalyseRequired =
    SCHUTZBEDARF_RANK[schutzbedarf.gesamt] >= SCHUTZBEDARF_RANK["hoch"];

  return {
    fromSchutzbedarf,
    bumpedByHints,
    bumpingHintAxisIds: bumpingHints,
    final,
    risikoanalyseRequired,
  };
}

export function scoreMatrix(answers: Answers): MatrixResult {
  const schutzbedarf = computeSchutzbedarf(answers);
  const absicherungsvariante = computeAbsicherungsvariante(schutzbedarf, answers);

  const axisScores = AXES.map((axis) => ({
    axisId: axis.id,
    optionId: answers[axis.id] ?? "",
    score: (scoreFor(axis, answers) ?? 0) as Score,
  }));

  return {
    schutzbedarf,
    absicherungsvariante,
    friendlyTier: absicherungsvariante.final,
    axisScores,
  };
}

export function getAxisById(id: string): Axis | undefined {
  return AXIS_BY_ID.get(id);
}

export { SCHUTZBEDARF_RANK, VARIANTE_RANK, maxSchutzbedarf };
