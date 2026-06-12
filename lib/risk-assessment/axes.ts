import type { Axis } from "./types";

// Eight axes for the Schutzbedarfsfeststellung-shaped heuristic.
//
// Three direct Schutzbedarf inputs (BSI-200-2 §8.2) — one per Grundwert:
//   personalData       → V (Vertraulichkeit)
//   integrity          → I (Integrität)
//   downtimeTolerance  → A (Verfügbarkeit)
//
// One Kumulationseffekt modifier (BSI-200-2 §8.2.4):
//   userCount          — can lift V upward when an asset aggregates many
//                        users / accesses worth protecting.
//
// Four Absicherungsvariante hints (BSI-200-3 territory: Schwachstellen
// + Eintrittswahrscheinlichkeit). These do NOT change the Schutzbedarf
// class, but they influence the recommended Vorgehensweise:
//   internetExposure   — threat surface (Gefährdungslage)
//   vendorSupport      — patch availability (Schwachstellen-Lage)
//   incidentHistory    — past evidence (Eintrittswahrscheinlichkeit)
//   replaceability     — BCP recovery feasibility
//
// User-facing question + option labels live in messages/riskAssessment/
// {de,en,nl}.json under axes.<axisId>.question and
// axes.<axisId>.options.<optionId>.

export const AXES: Axis[] = [
  // ─── Schutzbedarf direct inputs (BSI-200-2 §8.2) ────────────────────
  {
    id: "personalData",
    purpose: "schutzbedarf",
    grundwert: "v",
    options: [
      { id: "none", score: 0 },
      { id: "employeeOnly", score: 1 },
      { id: "customer", score: 2 },
      { id: "sensitivePii", score: 3 },
    ],
  },
  {
    id: "integrity",
    purpose: "schutzbedarf",
    grundwert: "i",
    options: [
      { id: "minor", score: 0 },
      { id: "moderate", score: 1 },
      { id: "high", score: 2 },
      { id: "critical", score: 3 },
    ],
  },
  {
    id: "downtimeTolerance",
    purpose: "schutzbedarf",
    grundwert: "a",
    options: [
      { id: "weeks", score: 0 },
      { id: "days", score: 1 },
      { id: "hours", score: 2 },
      { id: "minutes", score: 3 },
    ],
  },

  // ─── Kumulationseffekt modifier (BSI-200-2 §8.2.4) ─────────────────
  {
    id: "userCount",
    purpose: "kumulation",
    options: [
      { id: "tiny", score: 0 },
      { id: "small", score: 1 },
      { id: "large", score: 2 },
      { id: "externalToo", score: 3 },
    ],
  },

  // ─── Absicherungsvariante hints (BSI-200-3 inputs) ─────────────────
  {
    id: "internetExposure",
    purpose: "hint",
    options: [
      { id: "offline", score: 0 },
      { id: "internalOnly", score: 1 },
      { id: "vpn", score: 2 },
      { id: "internetExposed", score: 3 },
    ],
  },
  {
    id: "vendorSupport",
    purpose: "hint",
    options: [
      { id: "active", score: 0 },
      { id: "mature", score: 1 },
      { id: "eolAnnounced", score: 2 },
      { id: "abandoned", score: 3 },
    ],
  },
  {
    id: "incidentHistory",
    purpose: "hint",
    options: [
      { id: "none", score: 0 },
      { id: "minor", score: 1 },
      { id: "major", score: 2 },
      { id: "repeated", score: 3 },
    ],
  },
  {
    id: "replaceability",
    purpose: "hint",
    options: [
      { id: "oneDay", score: 0 },
      { id: "oneWeek", score: 1 },
      { id: "oneMonth", score: 2 },
      { id: "irreplaceable", score: 3 },
    ],
  },
];

export const AXIS_BY_ID = new Map(AXES.map((axis) => [axis.id, axis]));

export const AXES_BY_PURPOSE: Record<string, Axis[]> = AXES.reduce(
  (acc, axis) => {
    const list = acc[axis.purpose] ?? [];
    list.push(axis);
    acc[axis.purpose] = list;
    return acc;
  },
  {} as Record<string, Axis[]>,
);
