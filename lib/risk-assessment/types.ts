// BSI-200-2 Schutzbedarfsfeststellung — primary-source aligned.
//
// Schutzbedarfsklassen (§8.2): assets are classified per Grundwert
// (V/I/A) on the scale normal / hoch / sehr hoch. Maximum-Prinzip
// aggregates per-Grundwert classes into a single Gesamt-Schutzbedarf.
//
// Absicherungsvarianten (§3.4): the chosen ISMS implementation
// approach — Basis (broad, shallow entry), Standard (full Grundschutz,
// certifiable), Kern (deep focus on Kronjuwelen). These are EXPLICITLY
// distinct from Schutzbedarfsklassen — BSI online course Lerneinheit 4.2
// goes out of its way to warn against confusing them.
//
// 200-3 Risikoanalyse: REQUIRED when at least one Grundwert reaches
// hoch or sehr hoch (per BSI-200-3 + BSI-200-2 §8.5). The tool surfaces
// this requirement on the result page; it doesn't perform the analysis.
//
// "Hints" in this tool are non-Schutzbedarf inputs (vendor support,
// incident history, internet exposure, replaceability) — those live in
// 200-3 territory (Schwachstellen + Eintrittswahrscheinlichkeit), but
// they still inform the Absicherungsvariante recommendation here.

export type Grundwert = "v" | "i" | "a";

export type Schutzbedarf = "normal" | "hoch" | "sehrHoch";

export type Absicherungsvariante = "basis" | "standard" | "kern";

// Each axis serves one of three purposes:
// - "schutzbedarf": directly drives V/I/A Schutzbedarf class (200-2 §8.2)
// - "kumulation": Kumulationseffekt modifier per BSI-200-2 §8.2.4
// - "hint": informs the Absicherungsvariante recommendation
//   (BSI-200-3 territory: Schwachstelle / Eintrittswahrscheinlichkeit)
export type AxisPurpose = "schutzbedarf" | "kumulation" | "hint";

export type Score = 0 | 1 | 2 | 3;

export interface AxisOption {
  id: string;
  score: Score;
}

export interface Axis {
  id: string;
  purpose: AxisPurpose;
  /** Which Grundwert this axis drives. Only set when purpose="schutzbedarf". */
  grundwert?: Grundwert;
  options: AxisOption[];
}

export type Answers = Record<string, string>;

export interface GrundwertResult {
  class: Schutzbedarf;
  /** Axis answer strings that drove this classification ("axisId:optionId"). */
  drivers: string[];
}

export interface SchutzbedarfBreakdown {
  v: GrundwertResult;
  i: GrundwertResult;
  a: GrundwertResult;
  gesamt: Schutzbedarf;
  drivingGrundwert: Grundwert;
}

export interface AbsicherungsvarianteRecommendation {
  /** Variante suggested by Gesamt-Schutzbedarf alone, before hints. */
  fromSchutzbedarf: Absicherungsvariante;
  /** True if any hint pushed the recommendation up by one level (Basis → Standard only). */
  bumpedByHints: boolean;
  /** Hint axis ids whose score-3 answer triggered the bump. */
  bumpingHintAxisIds: string[];
  /** Final recommendation. */
  final: Absicherungsvariante;
  /** True iff BSI-200-3 Risikoanalyse is required (Gesamt-Schutzbedarf >= hoch). */
  risikoanalyseRequired: boolean;
}

export interface MatrixResult {
  schutzbedarf: SchutzbedarfBreakdown;
  absicherungsvariante: AbsicherungsvarianteRecommendation;
  /** Alias for components: same value as absicherungsvariante.final.
   *  Used for the radar fill colour and the friendly summary badge. */
  friendlyTier: Absicherungsvariante;
  axisScores: Array<{ axisId: string; optionId: string; score: Score }>;
}
