/**
 * L1 asset module conformance: the "large company with many servers" path.
 * Creates grouped asset entries through the real CrudPage create form
 * (SchemaForm, so the generic driver applies) and asserts each row lands
 * in the inventory. Grouping identical assets into one entry with a
 * quantity is the BSI 200-2 practice the module is built around.
 */
import { test, expect } from "@playwright/test";
import { assetInsertSchema } from "@/schema/validators";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { generateValue } from "../lib/value-factory";
import { fillFields } from "../lib/form-driver";
import { e2eQuery } from "../lib/db";

const metas = introspectSchema(
  assetInsertSchema as Parameters<typeof introspectSchema>[0],
);

const STADTWERK_ASSETS: Array<Record<string, unknown>> = [
  {
    name: "Leitstellen-SCADA-Server Cluster",
    type: "server",
    description: "Redundantes SCADA-Cluster der Netzleitstelle, Strom und Fernwaerme",
    quantity: 2,
    isOT: true,
    isCritical: true,
    owner: "Leiterin Netzleitstelle",
    location: "Rechenzentrum Nord, Brandabschnitt 2",
    hostname: "scada-ls-01",
    operatingSystem: "Windows Server 2022 LTSC",
    ipAddress: "10.20.0.11",
  },
  {
    name: "Virtualisierungscluster Verwaltung",
    type: "server",
    description: "48 virtualisierte Windows- und Linux-Server auf VMware, Buero-IT",
    quantity: 48,
    isOT: false,
    isCritical: false,
    owner: "IT-Leitung",
    location: "Rechenzentrum Nord",
    hostname: "esx-verw",
    operatingSystem: "VMware ESXi 8 / gemischt",
  },
  {
    name: "Arbeitsplatzrechner Verwaltung",
    // Matched against the German labeled option ("Endgerät ...").
    type: "Endgerät",
    description: "Standard-Clients der Verwaltung, zentral verwaltet ueber Intune",
    quantity: 180,
    isOT: false,
    isCritical: false,
    owner: "IT-Leitung",
    location: "Verwaltungsgebaeude Musterstadt",
    operatingSystem: "Windows 11",
  },
];

test.describe("asset inventory: grouped large-company entries", () => {
  for (const [i, overrides] of STADTWERK_ASSETS.entries()) {
    test(`create asset ${i + 1}: ${overrides.name}`, async ({ page }) => {
      await page.goto("/de/assets");
      const submit = page.getByTestId("schema-form-submit");
      await expect(submit).toBeVisible({ timeout: 20_000 });

      const values: Record<string, unknown> = {};
      for (const meta of metas) {
        values[meta.key] =
          meta.key in overrides ? overrides[meta.key] : generateValue(meta);
      }
      const filled = await fillFields(page, metas, values);
      expect(filled.length).toBeGreaterThan(3);

      await submit.click();
      // The row appears in the inventory table after the mutation + refresh.
      await expect(
        page.getByText(String(overrides.name), { exact: false }).first(),
      ).toBeVisible({ timeout: 20_000 });

      // Not-pretend guarantee: reload re-renders from the database.
      await page.reload();
      await expect(
        page.getByText(String(overrides.name), { exact: false }).first(),
      ).toBeVisible({ timeout: 20_000 });
    });
  }

  // Writing an asset reverts the requirements that reference the module, and
  // that reversal has to reach the audit trail. It did not: module-recheck
  // passed the module key "asset" as entity_id, a uuid column, so every insert
  // failed and logAudit only console.errored it. The suite stayed green for
  // weeks because nothing asserted the row. Runs last in the file so the three
  // creates above have already triggered the revert (workers: 1, serial).
  test("the revert those writes caused is recorded in the audit trail", async () => {
    // asset.create fires invalidateModuleSignOffs without awaiting it, so the
    // row lands after the mutation responds. Poll rather than read once.
    const read = () =>
      e2eQuery<{ entity_id: string | null; description: string }>(
        `SELECT entity_id, description
           FROM audit_log
          WHERE action = 'requirement.sign_off_invalidated'
            AND entity_type = 'module'
          ORDER BY created_at DESC`,
      );
    await expect
      .poll(async () => (await read()).length, {
        message: "sign_off_invalidated rows written",
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    const [latest] = await read();
    // The module key belongs in the description, never in the uuid column.
    expect(latest.entity_id).toBeNull();
    expect(latest.description).toContain("reverted");
  });

  // Grouping keeps a real inventory small (BSI 200-2, and the entries above
  // stand for 2 + 48 + 180 machines), but a self-hoster importing a CMDB dump
  // gets one row per machine. asset.list has no limit and no pagination and
  // the table renders every row, which is fine at this size and is exactly
  // the kind of thing a later "just add a LIMIT 100" would break silently:
  // the page would still look right, with the tail missing. Seeded by SQL
  // because 500 UI creates would cost minutes and prove nothing extra.
  test("a CMDB-sized inventory renders every row, none silently dropped", async ({ page }) => {
    const BULK = 500;
    const [{ company_id }] = await e2eQuery<{ company_id: string }>(
      `SELECT company_id FROM "user" WHERE email = 'dev@nis2.local'`,
    );
    await e2eQuery(
      `INSERT INTO asset (company_id, name, type, description, quantity, owner, location)
       SELECT $1, 'Lasttest ' || g, 'server', 'CMDB import row ' || g, 1, 'IT', 'RZ Nord'
         FROM generate_series(1, $2) g`,
      [company_id, BULK],
    );

    try {
      await page.goto("/de/assets");
      await expect(page.getByText("Lasttest 1", { exact: false }).first()).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByText(/^Lasttest \d+$/)).toHaveCount(BULK, { timeout: 60_000 });
    } finally {
      // Later layers sign off against this tenant; leave the inventory as found.
      await e2eQuery(`DELETE FROM asset WHERE name LIKE 'Lasttest %'`);
    }
  });
});
