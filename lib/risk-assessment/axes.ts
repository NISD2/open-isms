import type { Axis } from "./types";

// Seven-axis core matrix for NIS2 Art 21(2)(a) Schutzbedarfsfeststellung.
// Locked design: see sales/research/2026-06-11-nis2-risk-assessment-matrix-design.md
// in the private notebook for the legal foundation and lessons-learned that drove
// these specific axes, options, and hard-stops.
//
// User-facing question + option labels live in messages/riskAssessment/{de,en,nl}.json
// under axes.<axisId>.question and axes.<axisId>.options.<optionId>.
// The structural data (domain, score, hard-stop) is here.

export const AXES: Axis[] = [
  {
    id: "internetExposure",
    domain: "security",
    options: [
      { id: "offline", score: 0 },
      { id: "internalOnly", score: 1 },
      { id: "vpn", score: 2 },
      { id: "internetExposed", score: 3 },
    ],
    hardStop: { triggerScore: 3, minTier: "standard", noteKey: "internetExposed" },
  },
  {
    // Stable axis id is "userCount" for backwards compatibility, but the
    // axis now measures access/privilege scope, not headcount. Score order:
    // few standard users → many standard users → privileged users → external.
    // Privilege concentration drives V/I more directly than raw user count.
    id: "userCount",
    domain: "security",
    options: [
      { id: "tiny", score: 0 },
      { id: "small", score: 1 },
      { id: "large", score: 2 },
      { id: "externalToo", score: 3 },
    ],
  },
  {
    id: "vendorSupport",
    domain: "security",
    options: [
      { id: "active", score: 0 },
      { id: "mature", score: 1 },
      { id: "eolAnnounced", score: 2 },
      { id: "abandoned", score: 3 },
    ],
  },
  {
    id: "incidentHistory",
    domain: "security",
    options: [
      { id: "none", score: 0 },
      { id: "minor", score: 1 },
      { id: "major", score: 2 },
      { id: "repeated", score: 3 },
    ],
  },
  {
    id: "downtimeTolerance",
    domain: "operational",
    options: [
      { id: "weeks", score: 0 },
      { id: "days", score: 1 },
      { id: "hours", score: 2 },
      { id: "minutes", score: 3 },
    ],
    hardStop: { triggerScore: 3, minTier: "standard", noteKey: "downtimeMinutes" },
  },
  {
    id: "replaceability",
    domain: "operational",
    options: [
      { id: "oneDay", score: 0 },
      { id: "oneWeek", score: 1 },
      { id: "oneMonth", score: 2 },
      { id: "irreplaceable", score: 3 },
    ],
  },
  {
    id: "personalData",
    domain: "compliance",
    options: [
      { id: "none", score: 0 },
      { id: "employeeOnly", score: 1 },
      { id: "customer", score: 2 },
      { id: "sensitivePii", score: 3 },
    ],
    hardStop: { triggerScore: 3, minTier: "kern", noteKey: "sensitivePii" },
  },
];

export const AXIS_BY_ID = new Map(AXES.map((axis) => [axis.id, axis]));

export const AXES_BY_DOMAIN: Record<string, Axis[]> = AXES.reduce(
  (acc, axis) => {
    const list = acc[axis.domain] ?? [];
    list.push(axis);
    acc[axis.domain] = list;
    return acc;
  },
  {} as Record<string, Axis[]>,
);
