import { describe, expect, test } from "vitest";
import {
  incidentNotificationReport,
  incidentNotificationValue,
  REPORT_TYPE_VALUES,
  REPORT_STATUS_VALUES,
  validateReportSubmission,
} from "../src/db";
import { REPORT_TYPE } from "../src/schema";

describe("db tables", () => {
  test("report table exports with expected columns", () => {
    expect(incidentNotificationReport).toBeDefined();
    const columns = incidentNotificationReport;
    expect(columns.id).toBeDefined();
    expect(columns.incidentId).toBeDefined();
    expect(columns.reportType).toBeDefined();
    expect(columns.schemaVersion).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.tenantId).toBeDefined();
  });

  test("value table exports with expected columns", () => {
    expect(incidentNotificationValue).toBeDefined();
    expect(incidentNotificationValue.id).toBeDefined();
    expect(incidentNotificationValue.reportId).toBeDefined();
    expect(incidentNotificationValue.fieldId).toBeDefined();
    expect(incidentNotificationValue.value).toBeDefined();
  });

  test("REPORT_TYPE_VALUES matches REPORT_TYPE enum", () => {
    const fromEnum = Object.values(REPORT_TYPE).sort();
    const fromTable = [...REPORT_TYPE_VALUES].sort();
    expect(fromTable).toEqual(fromEnum);
  });

  test("REPORT_STATUS_VALUES has expected lifecycle states", () => {
    expect(REPORT_STATUS_VALUES).toEqual([
      "draft",
      "submitted",
      "acknowledged",
      "withdrawn",
    ]);
  });
});

describe("validateReportSubmission", () => {
  test("flags missing required fields", () => {
    const result = validateReportSubmission(REPORT_TYPE.EARLY_WARNING, {});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.length).toBeGreaterThan(0);
    expect(
      result.issues.some((i) =>
        i.message.includes("required for report type"),
      ),
    ).toBe(true);
  });

  test("flags unknown field id", () => {
    const result = validateReportSubmission(REPORT_TYPE.INCIDENT_NOTIFICATION, {
      bogusFieldId: "x",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      result.issues.some(
        (i) =>
          i.fieldId === "bogusFieldId" &&
          i.message.includes("not declared"),
      ),
    ).toBe(true);
  });

  test("flags enum value not in allowed options", () => {
    const result = validateReportSubmission(REPORT_TYPE.EARLY_WARNING, {
      suspectedUnlawfulOrMalicious: "definitelyNotAnOption",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      result.issues.some(
        (i) =>
          i.fieldId === "suspectedUnlawfulOrMalicious" &&
          i.message.includes("not in allowed options"),
      ),
    ).toBe(true);
  });

  test("flags type mismatch on boolean field", () => {
    const result = validateReportSubmission(REPORT_TYPE.EARLY_WARNING, {
      hasCrossBorderImpact: "yes",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      result.issues.some(
        (i) =>
          i.fieldId === "hasCrossBorderImpact" &&
          i.message.includes("expected boolean"),
      ),
    ).toBe(true);
  });

  test("accepts a valid early-warning submission", () => {
    const result = validateReportSubmission(REPORT_TYPE.EARLY_WARNING, {
      reportingReason: "significantIncident",
      incidentSummary: "Ransomware payload deployed on production fileserver.",
      incidentDetectedAt: "2026-06-03T08:15:00Z",
      suspectedUnlawfulOrMalicious: "suspected",
      hasCrossBorderImpact: false,
      reporterName: "Jane Doe",
      reporterEmail: "soc@example.eu",
    });
    if (!result.ok) {
      // surface unexpected issues for debugging
      throw new Error(
        `expected ok, got issues: ${result.issues
          .map((i) => `${i.fieldId}: ${i.message}`)
          .join("; ")}`,
      );
    }
    expect(result.ok).toBe(true);
  });

  test("ignores null / undefined values for non-required fields", () => {
    const result = validateReportSubmission(REPORT_TYPE.EARLY_WARNING, {
      reportingReason: "significantIncident",
      incidentSummary: "Test",
      incidentDetectedAt: "2026-06-03T08:15:00Z",
      suspectedUnlawfulOrMalicious: "suspected",
      hasCrossBorderImpact: false,
      reporterName: "Jane Doe",
      reporterEmail: "soc@example.eu",
      indicatorsOfCompromise: null,
    });
    if (!result.ok) {
      throw new Error(
        `expected ok, got issues: ${result.issues
          .map((i) => `${i.fieldId}: ${i.message}`)
          .join("; ")}`,
      );
    }
  });
});
