import type { QuestionStep } from "./types";

// Universal question steps — shown to every user regardless of NIS2 sector.
// These cover the categories every 50-250 person Mittelstand company has,
// across all five BSI §8.1 layers.
//
// Sector-specific add-ons live in sector-questions.ts (next PR).
//
// Plain-language phrasing is the goal. The auditor-grade BSI classification
// happens server-side via the AssetImplication mapping, not in the GF's UI.

export const UNIVERSAL_QUESTIONS: QuestionStep[] = [
  // ─── Geschäftsprozesse (§8.1 layer 1) ───────────────────────────
  {
    id: "business-processes",
    layer: "geschaeftsprozess",
    options: [
      {
        id: "sales-customer-service",
        implies: [{ layer: "geschaeftsprozess", category: "process", defaultExposure: "internal" }],
      },
      {
        id: "production-service-delivery",
        implies: [{ layer: "geschaeftsprozess", category: "process", defaultExposure: "internal" }],
      },
      {
        id: "procurement",
        implies: [{ layer: "geschaeftsprozess", category: "process", defaultExposure: "partner" }],
      },
      {
        id: "hr-payroll",
        implies: [{ layer: "geschaeftsprozess", category: "process", defaultExposure: "internal" }],
      },
      {
        id: "finance-accounting",
        implies: [{ layer: "geschaeftsprozess", category: "process", defaultExposure: "internal" }],
      },
      {
        id: "marketing-comms",
        implies: [{ layer: "geschaeftsprozess", category: "process", defaultExposure: "internet" }],
      },
    ],
  },

  // ─── Anwendungen (§8.1 layer 2) — internal apps ──────────────────
  {
    id: "internal-apps",
    layer: "anwendung",
    options: [
      {
        id: "email",
        implies: [{ layer: "anwendung", category: "application", defaultExposure: "internet" }],
      },
      {
        id: "accounting-software",
        implies: [{ layer: "anwendung", category: "application", defaultExposure: "internal" }],
      },
      {
        id: "file-storage",
        implies: [{ layer: "anwendung", category: "data_store", defaultExposure: "internal" }],
      },
      {
        id: "crm",
        implies: [{ layer: "anwendung", category: "application", defaultExposure: "internal" }],
      },
      {
        id: "erp",
        implies: [{ layer: "anwendung", category: "application", defaultExposure: "internal" }],
      },
      {
        id: "hr-software",
        implies: [{ layer: "anwendung", category: "application", defaultExposure: "internal" }],
      },
      {
        id: "video-conferencing",
        implies: [{ layer: "anwendung", category: "cloud_service", defaultExposure: "internet" }],
      },
    ],
  },

  // ─── IT-Systeme (§8.1 layer 3) ───────────────────────────────────
  {
    id: "it-infrastructure",
    layer: "it-system",
    options: [
      {
        id: "onprem-servers",
        implies: [{ layer: "it-system", category: "server", defaultExposure: "internal" }],
      },
      {
        id: "cloud-services",
        implies: [{ layer: "it-system", category: "cloud_service", defaultExposure: "internet" }],
      },
      {
        id: "endpoint-fleet",
        implies: [{ layer: "it-system", category: "endpoint", defaultExposure: "internal" }],
      },
      {
        id: "mobile-devices",
        implies: [{ layer: "it-system", category: "endpoint", defaultExposure: "internet" }],
      },
      {
        id: "network-equipment",
        implies: [{ layer: "it-system", category: "network", defaultExposure: "internal" }],
      },
      {
        id: "backup-system",
        implies: [{ layer: "it-system", category: "data_store", defaultExposure: "internal" }],
      },
    ],
  },
];

export const UNIVERSAL_QUESTION_BY_ID = new Map(
  UNIVERSAL_QUESTIONS.map((q) => [q.id, q]),
);
