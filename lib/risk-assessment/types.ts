export type Domain = "security" | "operational" | "compliance";

export type Tier = "basis" | "standard" | "kern";

export type Score = 0 | 1 | 2 | 3;

export interface AxisOption {
  id: string;
  score: Score;
}

export interface HardStop {
  triggerScore: Score;
  minTier: Tier;
  // i18n key under riskAssessment.hardStops.* that names this rule in the
  // result panel. Lives on the axis so adding a new hard-stop is a single edit.
  noteKey: string;
}

export interface Axis {
  id: string;
  domain: Domain;
  options: AxisOption[];
  hardStop?: HardStop;
}

export type Answers = Record<string, string>;

export interface DomainResult {
  domain: Domain;
  sum: number;
  tier: Tier;
  hardStopTriggered: boolean;
}

export interface MatrixResult {
  finalTier: Tier;
  drivingDomain: Domain;
  domains: DomainResult[];
  axisScores: Array<{ axisId: string; optionId: string; score: Score }>;
}
