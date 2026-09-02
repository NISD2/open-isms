/**
 * Fixture data for scripts/preview-pdfs.ts.
 *
 * Shaped to the real ReportData / PolicyData interfaces so the preview
 * exercises the same code path the routes do, and deliberately awkward: long
 * titles, a rejected requirement, an empty evidence list, a category with no
 * intake. A fixture where everything is tidy proves nothing about a layout.
 */

import type { PolicyData } from "@/lib/pdf/load-policy-data";
import type { ReportData } from "@/lib/pdf/load-report-data";

const FIXTURE_DATE = new Date("2026-03-02T00:00:00.000Z");

export const REPORT_FIXTURE: ReportData = {
  companyName: "Wertstoff Nordkreis GmbH",
  companySector: "Abfallbewirtschaftung",
  frameworkName: "NIS 2 / BSIG",
  assessmentDate: FIXTURE_DATE,
  totalRequirements: 24,
  completedCount: 19,
  approvedCount: 14,
  categories: [
    {
      code: "GOV",
      name: "Governance und Verantwortlichkeit des Leitungsorgans",
      description:
        "Das Leitungsorgan billigt die Risikomanagementmaßnahmen, überwacht ihre Umsetzung und haftet für Verstöße.",
      grundschutzModule: "ISMS.1",
      bsiGuidance:
        "Nachweis über Billigung, Überwachung und Schulung des Leitungsorgans nach §38 BSIG.",
      intakeAnswers: {
        managementApprovalDate: "2026-02-10",
        boardTrainingCompleted: true,
        securityBudgetShare: "4.2%",
      },
      intakeSignedOffAt: FIXTURE_DATE,
      requirements: [
        {
          code: "GOV-01",
          title: "Billigung der Risikomanagementmaßnahmen durch das Leitungsorgan",
          description: "",
          priority: "high",
          legalRef: "§38 Abs. 1 BSIG",
          evidenceType: "document",
          status: "approved",
          reviewFeedback: null,
          signedOffRole: "Geschäftsführung",
          signedOffAt: FIXTURE_DATE,
          signOffSnapshot: {
            templateVersion: 3,
            derivedData: { measures: { total: 10 }, openFindings: { total: 2 } },
          },
          evidence: [
            {
              fileName: "gf-beschluss-2026-02-10.pdf",
              fileType: "application/pdf",
              fileSize: 184320,
              uploadedAt: FIXTURE_DATE,
              status: "approved",
            },
          ],
        },
        {
          code: "GOV-02",
          title: "Regelmäßige Schulung der Mitglieder des Leitungsorgans",
          description: "",
          priority: "medium",
          legalRef: "§38 Abs. 3 BSIG",
          evidenceType: "document",
          status: "rejected",
          reviewFeedback:
            "Der eingereichte Nachweis belegt eine allgemeine IT-Sicherheitsschulung, nicht die nach §38 Abs. 3 BSIG geforderte NIS-2-Schulung des Leitungsorgans. Bitte Teilnahmebescheinigung nachreichen.",
          signedOffRole: null,
          signedOffAt: null,
          signOffSnapshot: null,
          evidence: [],
        },
      ],
    },
    {
      code: "SUP",
      name: "Sicherheit der Lieferkette",
      description:
        "Bewertung und Steuerung der Sicherheit unmittelbarer Anbieter und Dienstleister.",
      grundschutzModule: null,
      bsiGuidance: null,
      intakeAnswers: null,
      intakeSignedOffAt: null,
      requirements: [
        {
          code: "SUP-01",
          title: "Lieferantenregister mit Kritikalitätsbewertung",
          description: "",
          priority: "high",
          legalRef: "§30 Abs. 2 Nr. 6 BSIG",
          evidenceType: "register",
          status: "completed",
          reviewFeedback: null,
          signedOffRole: "IT-Leitung",
          signedOffAt: FIXTURE_DATE,
          signOffSnapshot: null,
          evidence: [
            {
              fileName: "lieferantenregister-q1-2026.xlsx",
              fileType: "application/vnd.ms-excel",
              fileSize: 41984,
              uploadedAt: FIXTURE_DATE,
              status: "pending",
            },
          ],
        },
      ],
    },
  ],
};

export const POLICY_FIXTURE: PolicyData = {
  companyName: "Wertstoff Nordkreis GmbH",
  categoryCode: "SUP",
  categoryName: "Sicherheit der Lieferkette",
  frameworkName: "NIS 2 / BSIG",
  signedOffBy: "Geschäftsführung",
  signedOffAt: FIXTURE_DATE,
  groups: [
    {
      code: "SUP-01",
      title: "Lieferantenregister",
      legalRef: "§30 Abs. 2 Nr. 6 BSIG, NIS 2 Art. 21(2)(d)",
      fields: [
        {
          key: "registerMaintained",
          label: "Register geführt",
          value: true,
          type: "boolean",
        },
        {
          key: "supplierCount",
          label: "Erfasste Lieferanten",
          value: 34,
          type: "number",
        },
        {
          key: "lastReviewDate",
          label: "Letzte Überprüfung",
          value: "2026-02-18",
          type: "date",
        },
        {
          key: "criticalityMethod",
          label: "Kritikalitätsbewertung",
          value: "BSI-Standard 200-3, vereinfachte 5x5-Matrix",
          type: "text",
        },
      ],
    },
    {
      code: "SUP-02",
      title: "Vertragliche Sicherheitsanforderungen",
      legalRef: "§30 Abs. 2 Nr. 6 BSIG",
      fields: [
        {
          key: "securityClauses",
          label: "IS-Klauseln vereinbart",
          value: true,
          type: "boolean",
        },
        { key: "dpaCoverage", label: "AVV-Abdeckung", value: "28 von 34", type: "text" },
        {
          key: "incidentNotice",
          label: "Meldefrist Lieferant",
          value: "24 Stunden",
          type: "text",
        },
        {
          key: "auditRight",
          label: "Auditrecht vereinbart",
          value: false,
          type: "boolean",
        },
        { key: "nextReview", label: "Nächste Überprüfung", value: null, type: "date" },
      ],
    },
  ],
};
