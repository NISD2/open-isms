/**
 * L2 module sweep: every CrudPage module (except suppliers, which is an
 * invite flow, and assets, covered in l1) gets one record created through
 * its real create form, fully filled by the factory, and asserted present
 * in the module's list afterwards. One generic pattern, eleven modules —
 * a new CrudPage module joins the sweep by adding one config row.
 */
import { test, expect } from "@playwright/test";
import type { z } from "zod";
import {
  riskInsertSchema,
  incidentInsertSchema,
  policyInsertSchema,
  patchRecordInsertSchema,
  changeRequestInsertSchema,
  kpiMeasurementInsertSchema,
  exerciseInsertSchema,
  improvementItemInsertSchema,
  vulnerabilityInsertSchema,
  internalAuditInsertSchema,
  managementReviewInsertSchema,
} from "@/schema/validators";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { generateValue } from "../lib/value-factory";
import { fillFields } from "../lib/form-driver";

type AnySchema = Parameters<typeof introspectSchema>[0];

const MODULES: Array<{
  route: string;
  schema: AnySchema;
  overrides?: Record<string, unknown>;
}> = [
  { route: "risks", schema: riskInsertSchema as unknown as AnySchema, overrides: { title: "Ausfall Fernwirktechnik durch Ransomware" } },
  { route: "incidents", schema: incidentInsertSchema as unknown as AnySchema, overrides: { title: "Phishing-Welle Leitstellenpersonal" } },
  { route: "policies", schema: policyInsertSchema as unknown as AnySchema, overrides: { title: "IT-Sicherheitsleitlinie Stadtwerk" } },
  { route: "patches", schema: patchRecordInsertSchema as unknown as AnySchema, overrides: { patchIdentifier: "KB5044284 Leitstellen-Cluster", title: "Sicherheitsupdate SCADA-Hosts Oktober" } },
  { route: "changes", schema: changeRequestInsertSchema as unknown as AnySchema, overrides: { title: "Segmentierung OT-Netz Phase 2" } },
  { route: "kpis", schema: kpiMeasurementInsertSchema as unknown as AnySchema },
  { route: "exercises", schema: exerciseInsertSchema as unknown as AnySchema, overrides: { title: "Krisenstabsuebung Blackout-Szenario" } },
  { route: "improvements", schema: improvementItemInsertSchema as unknown as AnySchema, overrides: { title: "Massnahme aus Phishing-Nachbereitung" } },
  { route: "vulnerabilities", schema: vulnerabilityInsertSchema as unknown as AnySchema, overrides: { title: "Veraltete Firmware Fernwirkkoepfe" } },
  { route: "internal-audits", schema: internalAuditInsertSchema as unknown as AnySchema, overrides: { title: "Internes Audit Zugriffssteuerung" } },
  { route: "management-reviews", schema: managementReviewInsertSchema as unknown as AnySchema, overrides: { title: "Management Review Q3 2026" } },
];

test.describe("module create sweep", () => {
  for (const mod of MODULES) {
    test(`create one record in /${mod.route}`, async ({ page }) => {
      const metas = introspectSchema(mod.schema);
      const overrides = mod.overrides ?? {};
      const values: Record<string, unknown> = {};
      for (const meta of metas) {
        // FK pickers (assetId, supplierId, ...) stay empty: the factory
        // cannot invent valid foreign ids and they are optional links.
        if (meta.key.endsWith("Id") && !(meta.key in overrides)) continue;
        values[meta.key] =
          meta.key in overrides ? overrides[meta.key] : generateValue(meta);
      }

      await page.goto(`/de/${mod.route}`);
      const submit = page.getByTestId("schema-form-submit");
      await expect(submit).toBeVisible({ timeout: 20_000 });

      const filled = await fillFields(page, metas, values);
      expect(filled.length, `no fields rendered on /${mod.route}`).toBeGreaterThan(1);

      await submit.click();

      // The most identifying filled text value must appear in the list.
      const marker =
        (overrides.title as string | undefined) ??
        String(values[filled.find((k) => typeof values[k] === "string") ?? filled[0]]);
      await expect(page.getByText(marker, { exact: false }).first()).toBeVisible({
        timeout: 20_000,
      });
    });
  }
});
