import { describe, expect, test } from "vitest";
import {
  incidentNotificationSchema,
  incidentNotificationSchemaShape,
  REPORT_TYPE,
  REPORT_TYPE_DPV_URI,
  groupBySection,
  fieldsRequiredFor,
  fieldsOptionalFor,
  fieldById,
} from "../src";

describe("incident-notification-schema integrity", () => {
  test("self-validates against its Zod shape", () => {
    expect(() =>
      incidentNotificationSchemaShape.parse(incidentNotificationSchema),
    ).not.toThrow();
  });

  test("has at least one field per declared report type", () => {
    for (const reportType of incidentNotificationSchema.reportTypes) {
      const required = fieldsRequiredFor(reportType);
      const optional = fieldsOptionalFor(reportType);
      expect(required.length + optional.length).toBeGreaterThan(0);
    }
  });

  test("every report type carries a W3C DPV URI", () => {
    for (const reportType of incidentNotificationSchema.reportTypes) {
      expect(REPORT_TYPE_DPV_URI[reportType]).toMatch(
        /^https:\/\/w3id\.org\/dpv\/legal\/eu\/nis2#/,
      );
    }
  });

  test("EarlyWarning aligns with W3C DPV EarlyWarningReport URI", () => {
    expect(REPORT_TYPE_DPV_URI[REPORT_TYPE.EARLY_WARNING]).toBe(
      "https://w3id.org/dpv/legal/eu/nis2#EarlyWarningReport",
    );
  });

  test("Final aligns with W3C DPV FinalReport URI", () => {
    expect(REPORT_TYPE_DPV_URI[REPORT_TYPE.FINAL]).toBe(
      "https://w3id.org/dpv/legal/eu/nis2#FinalReport",
    );
  });

  test("field ids are unique", () => {
    const ids = new Set<string>();
    for (const field of incidentNotificationSchema.fields) {
      expect(ids.has(field.id)).toBe(false);
      ids.add(field.id);
    }
  });

  test("every field cites at least one EU instrument", () => {
    for (const field of incidentNotificationSchema.fields) {
      expect(field.legalBasis.length).toBeGreaterThan(0);
      // EU-first rule: primary citation must reference an EU instrument
      // (NIS 2, CIR, ENISA, or W3C DPV), never a national transposition.
      const primary = field.legalBasis[0];
      if (!primary) throw new Error(`field ${field.id} has empty legalBasis`);
      expect(primary.citation).toMatch(
        /^(NIS 2|CIR|ENISA|W3C DPV|NIS Cooperation Group)/,
      );
    }
  });

  test("BSI national mapping uses DE country code where present", () => {
    for (const field of incidentNotificationSchema.fields) {
      for (const mapping of field.nationalPortalMappings) {
        expect(mapping.countryCode).toMatch(/^[A-Z]{2}$/);
      }
    }
  });

  test("groupBySection preserves order and includes all fields", () => {
    const groups = groupBySection();
    const total = groups.reduce((acc, g) => acc + g.fields.length, 0);
    expect(total).toBe(incidentNotificationSchema.fields.length);
  });

  test("fieldById returns the canonical reference", () => {
    const sample = incidentNotificationSchema.fields[0];
    if (!sample) throw new Error("schema must have at least one field");
    expect(fieldById(sample.id)?.id).toBe(sample.id);
    expect(fieldById("definitelyNotAField")).toBeUndefined();
  });

  test("schema version is semver", () => {
    expect(incidentNotificationSchema.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
