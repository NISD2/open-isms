/**
 * L2 Durchgang registers: the walk names an asset and its provider (2.2), then rates it on the
 * 200-3 scales (2.3), through the real UI against real Postgres.
 *
 * The tenant may already hold assets from earlier specs, so the rating screen is answered for
 * every row it shows (Weiter waits until all are rated), and cleanup removes exactly what this
 * file added: its asset, the suppliers and risks that did not exist before. The tenant is lifted
 * to a paid account for the file and put back afterwards, as in durchgang.spec.ts.
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { E2E_USER_EMAIL } from "../lib/env";

// 2.2 keeps its four catalogue checklists whether or not the register has entries, so "Welches
// Programm genau, und von wem?" is screen 7 (learn, list, sources, four checklists, ...).
const WHICH_SOFTWARE = 7;
// 2.3: learn, software, technology, suppliers, map, done.
const RATE_SOFTWARE = 1;
const RATE_SUPPLIERS = 3;

const KIND = "E2E Buchhaltung";
const PRODUCT = "E2E DATEV Unternehmen online";
const PROVIDER = "E2E DATEV eG";

interface Tenant {
  company_id: string;
  billing_account_id: string;
  access_level: string;
}

interface StoredRisk {
  likelihood: number;
  impact: number;
  risk_score: number;
  treatment: string;
  accepted_at: string | null;
}

const idsOf = async (sql: string, companyId: string) =>
  new Set((await e2eQuery<{ id: string }>(sql, [companyId])).map((r) => r.id));

const assetRisks = (assetId: string) =>
  e2eQuery<StoredRisk>(
    `SELECT r.likelihood, r.impact, r.risk_score, r.treatment, r.accepted_at
       FROM risk r JOIN risk_asset l ON l.risk_id = r.id
      WHERE l.asset_id = $1`,
    [assetId],
  );

/** Answers every rating row on the screen; Weiter waits until all are rated. */
const rateAll = async (
  page: import("@playwright/test").Page,
  frequency: string,
  impact: string,
) => {
  for (const select of await page
    .getByRole("combobox", { name: /^Wie oft es eintritt:/ })
    .all()) {
    await select.selectOption(frequency);
  }
  for (const select of await page
    .getByRole("combobox", { name: /^Wie groß der Schaden wäre:/ })
    .all()) {
    await select.selectOption(impact);
  }
};

test.describe("durchgang registers", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let assetId: string;
  let suppliersBefore: Set<string>;
  let levelsBefore: ReadonlyArray<{ id: string; risk_level: string | null }>;
  let risksBefore: Set<string>;

  test.beforeAll(async () => {
    const [row] = await e2eQuery<Tenant>(
      `SELECT c.id AS company_id, b.id AS billing_account_id, b.access_level
         FROM "user" u
         JOIN company c ON c.id = u.company_id
         JOIN billing_account b ON b.id = c.billing_account_id
        WHERE u.email = $1`,
      [E2E_USER_EMAIL],
    );
    if (!row) throw new Error("the e2e tenant has no billing account");
    tenant = row;
    // Rating the suppliers sets the register level of every supplier the screen lists.
    levelsBefore = await e2eQuery<{ id: string; risk_level: string | null }>(
      `SELECT id, risk_level FROM supplier WHERE customer_company_id = $1`,
      [tenant.company_id],
    );
    suppliersBefore = new Set(levelsBefore.map((s) => s.id));
    risksBefore = await idsOf(
      `SELECT id FROM risk WHERE company_id = $1`,
      tenant.company_id,
    );
    const [added] = await e2eQuery<{ id: string }>(
      `INSERT INTO asset (company_id, name, type) VALUES ($1, $2, 'application') RETURNING id`,
      [tenant.company_id, KIND],
    );
    if (!added) throw new Error("could not add the test asset");
    assetId = added.id;
    await e2eQuery(`UPDATE billing_account SET access_level = 'full' WHERE id = $1`, [
      tenant.billing_account_id,
    ]);
  });

  test.afterAll(async () => {
    const risks = await e2eQuery<{ id: string }>(
      `SELECT id FROM risk WHERE company_id = $1`,
      [tenant.company_id],
    );
    for (const { id } of risks.filter((r) => !risksBefore.has(r.id))) {
      await e2eQuery(`DELETE FROM risk_asset WHERE risk_id = $1`, [id]);
      await e2eQuery(`DELETE FROM risk_supplier WHERE risk_id = $1`, [id]);
      await e2eQuery(`DELETE FROM risk WHERE id = $1`, [id]);
    }
    await e2eQuery(`DELETE FROM asset WHERE id = $1`, [assetId]);
    const suppliers = await e2eQuery<{ id: string }>(
      `SELECT id FROM supplier WHERE customer_company_id = $1`,
      [tenant.company_id],
    );
    for (const { id } of suppliers.filter((s) => !suppliersBefore.has(s.id))) {
      await e2eQuery(`DELETE FROM supplier WHERE id = $1`, [id]);
    }
    for (const { id, risk_level } of levelsBefore) {
      await e2eQuery(`UPDATE supplier SET risk_level = $2 WHERE id = $1`, [
        id,
        risk_level,
      ]);
    }
    await e2eQuery(`UPDATE billing_account SET access_level = $2 WHERE id = $1`, [
      tenant.billing_account_id,
      tenant.access_level,
    ]);
  });

  test("names an asset and adds its provider to the supplier list (2.2)", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/2.2?s=${WHICH_SOFTWARE}`);
    const what = page.locator(`#what-${assetId}`);
    await expect(what).toBeVisible({ timeout: 30_000 });

    await what.fill(PRODUCT);
    await page.locator(`#provider-${assetId}`).fill(PROVIDER);
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => {
        const [row] = await e2eQuery<{
          name: string;
          description: string | null;
          supplier: string | null;
        }>(
          `SELECT a.name, a.description, s.name AS supplier
             FROM asset a LEFT JOIN supplier s ON s.id = a.supplier_id
            WHERE a.id = $1`,
          [assetId],
        );
        return row ?? null;
      })
      .toEqual({ name: PRODUCT, description: KIND, supplier: PROVIDER });

    const [provider] = await e2eQuery<{ customer_company_id: string }>(
      `SELECT customer_company_id FROM supplier WHERE name = $1`,
      [PROVIDER],
    );
    expect(provider?.customer_company_id).toBe(tenant.company_id);
  });

  test("rates every listed program and stores one risk linked to each (2.3)", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/2.3?s=${RATE_SOFTWARE}`);
    await expect(page.getByText(PRODUCT)).toBeVisible({ timeout: 30_000 });
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await expect(next).toBeDisabled();

    await rateAll(page, "frequent", "considerable");
    // Frequent and considerable meet at "hoch" in the 200-3 matrix.
    const row = page.getByRole("listitem").filter({ hasText: PRODUCT });
    await expect(row.getByText("Hoch", { exact: true })).toBeVisible();
    await next.click();

    await expect
      .poll(() => assetRisks(assetId))
      .toEqual([
        {
          likelihood: 3,
          impact: 3,
          risk_score: 9,
          treatment: "mitigate",
          accepted_at: null,
        },
      ]);
  });

  test("a second rating updates the same risk instead of adding one (2.3)", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/2.3?s=${RATE_SOFTWARE}`);
    // The stored rating is shown, so the screen is already complete.
    const frequency = page.getByRole("combobox", {
      name: `Wie oft es eintritt: ${PRODUCT}`,
    });
    await expect(frequency).toHaveValue("frequent", { timeout: 30_000 });

    await page
      .getByRole("combobox", { name: `Wie groß der Schaden wäre: ${PRODUCT}` })
      .selectOption("existential");
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(() => assetRisks(assetId))
      .toEqual([
        {
          likelihood: 3,
          impact: 4,
          risk_score: 12,
          treatment: "mitigate",
          accepted_at: null,
        },
      ]);
  });

  test("rates the suppliers: one linked risk each, and the register level follows (2.3)", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/2.3?s=${RATE_SUPPLIERS}`);
    const provider = page.getByRole("listitem").filter({ hasText: PROVIDER });
    await expect(provider).toBeVisible({ timeout: 30_000 });

    // Frequent and existential meet at "sehr hoch", which the supplier register calls critical.
    await rateAll(page, "frequent", "existential");
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => {
        const [row] = await e2eQuery<{ risk_level: string | null; links: number }>(
          `SELECT s.risk_level, count(l.id)::int AS links
             FROM supplier s LEFT JOIN risk_supplier l ON l.supplier_id = s.id
            WHERE s.customer_company_id = $1 AND s.name = $2
            GROUP BY s.risk_level`,
          [tenant.company_id, PROVIDER],
        );
        return row ?? null;
      })
      .toEqual({ risk_level: "critical", links: 1 });
  });
});
