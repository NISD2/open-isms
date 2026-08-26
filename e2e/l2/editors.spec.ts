/**
 * L2 custom editors: the nine bespoke config surfaces that bypass
 * SchemaForm entirely — five PolicyEditorShell editors, the risk
 * methodology, and the three register/treatment views. Every spec drives
 * the real UI, waits on the actual mutation, asserts the JSONB/row in
 * Postgres, and re-renders after reload.
 */
import { test, expect, type Page } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { gotoRequirement } from "../lib/journey";

const RISK_TITLE = "E2E Risiko Datenbankausfall Kernsystem";
const SUPPLIER_RISK_TITLE = "E2E Lieferantenausfall Rechenzentrum";

async function trpcOk(page: Page, procedure: string, action: () => Promise<void>): Promise<void> {
  const [resp] = await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes(procedure),
      { timeout: 20_000 },
    ),
    action(),
  ]);
  expect(resp.ok(), `${procedure} returned HTTP ${resp.status()}`).toBe(true);
}

async function policyConfig(policyType: string): Promise<Record<string, unknown>> {
  const rows = await e2eQuery<{ config: Record<string, unknown> }>(
    `SELECT config FROM company_policy_config WHERE policy_type = $1`,
    [policyType],
  );
  expect(rows.length, `config row for ${policyType}`).toBe(1);
  return rows[0].config;
}

test("6.4 patch policy: SLA and review cycle round-trip", async ({ page }) => {
  await gotoRequirement(page, "6.4");
  await page.getByTestId("policy-editor-edit").click();
  await page.getByTestId("patch-sla-critical").fill("12");
  await page.getByTestId("patch-review-cycle").fill("3");
  await trpcOk(page, "policyConfig.update", () => page.getByTestId("policy-editor-save").click());

  const config = await policyConfig("patch_mgmt");
  expect((config.patchSlaHours as Record<string, number>).critical).toBe(12);
  expect(config.reviewCycleYears).toBe(3);

  await page.reload();
  await expect(page.getByTestId("patch-sla-critical")).toHaveValue("12");
  await expect(page.getByTestId("patch-sla-critical")).toBeDisabled();
});

test("9.1 crypto policy: key rotation round-trip", async ({ page }) => {
  await gotoRequirement(page, "9.1");
  await page.getByTestId("policy-editor-edit").click();
  await page.getByTestId("crypto-key-rotation").fill("2");
  await trpcOk(page, "policyConfig.update", () => page.getByTestId("policy-editor-save").click());

  const config = await policyConfig("crypto");
  expect(config.keyRotationFrequencyYears).toBe(2);
  expect(Array.isArray(config.algorithms)).toBe(true);
  expect((config.algorithms as unknown[]).length).toBeGreaterThan(0);

  await page.reload();
  await expect(page.getByTestId("crypto-key-rotation")).toHaveValue("2");
});

test("10.1 access control: model, review frequencies, SLA round-trip", async ({ page }) => {
  await gotoRequirement(page, "10.1");
  await page.getByTestId("policy-editor-edit").click();

  await page.getByTestId("access-model-select").click();
  await page.getByRole("option", { name: /Hybrid/ }).click();
  await page.getByTestId("access-review-standard").fill("halbjaehrlich");
  await page.getByTestId("access-review-privileged").fill("monatlich");
  await trpcOk(page, "policyConfig.update", () => page.getByTestId("policy-editor-save").click());

  const config = await policyConfig("access_control");
  expect(config.model).toBe("hybrid");
  expect((config.reviewFrequency as Record<string, string>).standard).toBe("halbjaehrlich");
  expect((config.reviewFrequency as Record<string, string>).privileged).toBe("monatlich");

  await page.reload();
  await expect(page.getByTestId("access-review-standard")).toHaveValue("halbjaehrlich");
});

test("6.1 procurement: threshold and clause toggle round-trip", async ({ page }) => {
  await gotoRequirement(page, "6.1");
  await page.getByTestId("policy-editor-edit").click();
  await page.getByTestId("procurement-threshold").fill("25000");
  await page.getByTestId("procurement-clause-auditRights").click(); // default true -> false
  await trpcOk(page, "policyConfig.update", () => page.getByTestId("policy-editor-save").click());

  const config = await policyConfig("procurement");
  expect(config.thresholdEur).toBe(25000);
  expect((config.requiredClauses as Record<string, boolean>).auditRights).toBe(false);

  await page.reload();
  await expect(page.getByTestId("procurement-threshold")).toHaveValue("25000");
  await expect(page.getByTestId("procurement-clause-auditRights")).toHaveAttribute("aria-checked", "false");
});

test("6.2 secure development: frameworks and segregation round-trip", async ({ page }) => {
  await gotoRequirement(page, "6.2");
  await page.getByTestId("policy-editor-edit").click();

  await page.getByTestId("sdlc-framework-select").click();
  await page.getByRole("option", { name: /BSIMM/ }).click();
  await page.getByTestId("hardening-baseline-select").click();
  await page.getByRole("option", { name: /Grundschutz|BSI/ }).first().click();
  const segregation = page.getByTestId("environment-segregation");
  const before = await segregation.getAttribute("aria-checked");
  await segregation.click();
  await trpcOk(page, "policyConfig.update", () => page.getByTestId("policy-editor-save").click());

  const config = await policyConfig("secure_dev");
  expect(config.sdlcFramework).toBe("bsimm");
  expect(config.hardeningBaseline).toBe("bsi");
  expect(config.environmentSegregation).toBe(before !== "true");

  await page.reload();
  await expect(page.getByTestId("sdlc-framework-select")).toContainText(/BSIMM/);
});

test("2.1 risk methodology: name and acceptance threshold round-trip", async ({ page }) => {
  await gotoRequirement(page, "2.1");
  await page.getByTestId("methodology-edit").click();
  await page.getByTestId("methodology-name").fill("BSI 200-3 Stadtwerk-Anpassung E2E");
  await page.getByTestId("methodology-threshold").click();
  await page.getByRole("option", { name: "6", exact: true }).click();
  await trpcOk(page, "risk.updateMethodology", () => page.getByTestId("methodology-save").click());

  const rows = await e2eQuery<{ name: string; acceptance_threshold: number }>(
    `SELECT name, acceptance_threshold FROM company_risk_methodology`,
  );
  expect(rows.length).toBe(1);
  expect(rows[0].name).toBe("BSI 200-3 Stadtwerk-Anpassung E2E");
  expect(Number(rows[0].acceptance_threshold)).toBe(6);

  await page.reload();
  await expect(page.getByTestId("methodology-name")).toHaveValue("BSI 200-3 Stadtwerk-Anpassung E2E");
});

test("2.3 asset risk register: create and link a risk to an asset", async ({ page }) => {
  await gotoRequirement(page, "2.3");

  // The first add button following the asset's name in document order is
  // that asset's own row button.
  await page
    .getByText("Customer Database (PostgreSQL)", { exact: false })
    .first()
    .locator('xpath=following::*[@data-testid="risk-register-add"][1]')
    .click();
  await page.getByTestId("risk-form-title").fill(RISK_TITLE);
  await page.getByTestId("matrix-cell-4-4").click();
  await trpcOk(page, "risk.linkAsset", () => page.getByTestId("risk-form-submit").click());

  const rows = await e2eQuery<{ title: string; risk_score: number }>(
    `SELECT r.title, r.risk_score FROM risk r
       JOIN risk_asset ra ON ra.risk_id = r.id
       JOIN asset a ON a.id = ra.asset_id
      WHERE r.title = $1 AND a.name LIKE 'Customer Database%'`,
    [RISK_TITLE],
  );
  expect(rows.length).toBe(1);
  expect(Number(rows[0].risk_score)).toBe(16);

  await page.reload();
  await expect(page.getByText(RISK_TITLE).first()).toBeVisible({ timeout: 20_000 });
});

test("2.4 risk treatment: measure, residual score, acceptance", async ({ page }) => {
  await gotoRequirement(page, "2.4");

  // Expand the card of the risk created in 2.3 (score 16 > threshold 6).
  await page.getByRole("button").filter({ hasText: RISK_TITLE }).first().click();
  await page.getByTestId("treatment-add").first().click();
  await page.getByTestId("treatment-action").fill("Notfallwiederherstellung dokumentieren und testen");
  await page.getByTestId("treatment-submit").click();
  await expect(page.getByText("Notfallwiederherstellung dokumentieren und testen").first()).toBeVisible({
    timeout: 20_000,
  });

  await page.getByTestId("residual-open").first().click();
  await trpcOk(page, "risk.update", () => page.getByTestId("matrix-cell-1-1").first().click());

  const accept = page.getByTestId("risk-accept");
  await expect(accept.first()).toBeVisible({ timeout: 20_000 });
  await trpcOk(page, "risk.update", () => accept.first().click());

  const rows = await e2eQuery<{ accepted_at: string | null; residual_likelihood: number }>(
    `SELECT accepted_at, residual_likelihood FROM risk WHERE title = $1`,
    [RISK_TITLE],
  );
  expect(rows.length).toBe(1);
  expect(rows[0].accepted_at).not.toBeNull();
  expect(Number(rows[0].residual_likelihood)).toBe(1);

  const treatments = await e2eQuery<{ action: string }>(
    `SELECT t.action FROM risk_treatment t JOIN risk r ON r.id = t.risk_id WHERE r.title = $1`,
    [RISK_TITLE],
  );
  expect(treatments.length).toBe(1);
});

test("5.3 supplier risk register: create and link a risk to a supplier", async ({ page }) => {
  await gotoRequirement(page, "5.3");

  await page
    .getByText("Hetzner Online GmbH", { exact: false })
    .first()
    .locator('xpath=following::*[@data-testid="risk-register-add"][1]')
    .click();
  await page.getByTestId("risk-form-title").fill(SUPPLIER_RISK_TITLE);
  await page.getByTestId("matrix-cell-4-4").click();
  await trpcOk(page, "risk.linkSupplier", () => page.getByTestId("risk-form-submit").click());

  const rows = await e2eQuery<{ title: string }>(
    `SELECT r.title FROM risk r
       JOIN risk_supplier rs ON rs.risk_id = r.id
       JOIN supplier s ON s.id = rs.supplier_id
      WHERE r.title = $1 AND s.name LIKE 'Hetzner%'`,
    [SUPPLIER_RISK_TITLE],
  );
  expect(rows.length).toBe(1);

  await page.reload();
  await expect(page.getByText(SUPPLIER_RISK_TITLE).first()).toBeVisible({ timeout: 20_000 });
});
