/**
 * L2 Durchgang lists: the short ways to jot things down, through the real UI against real
 * Postgres. A company that already has entries gets the same checklist as a new one, with what is
 * on its register ticked (2.2), and a supplier is one line with what it does (5.1).
 *
 * Cleanup removes the assets and suppliers this file adds, because later layers read this tenant
 * (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { e2eTenant, payFor, type Tenant, type Undo, undoAll } from "../lib/durchgang";

// 2.2: learn, example, then the processes checklist.
const PROCESSES_SCREEN = 2;
// 5.1: learn, example, the list of creditors at hand, then the supplier list.
const SUPPLIERS_SCREEN = 3;
const LISTED = "Beschaffung";
const TICKED = "Vertrieb und Kundenservice";
const SUPPLIER = "E2E Muster IT GmbH";
const SUPPLIER_DOES = "betreut die Server, hat Fernzugriff";

const assetNamed = async (tenant: Tenant, name: string) =>
  (
    await e2eQuery<{ id: string }>(
      `SELECT id FROM asset WHERE company_id = $1 AND name = $2`,
      [tenant.company_id, name],
    )
  ).length;

/** Gives the register one process the catalogue knows, unless it has it already. */
async function seedRegister(tenant: Tenant): Promise<Undo> {
  const had = new Set(
    (
      await e2eQuery<{ name: string }>(
        `SELECT name FROM asset WHERE company_id = $1 AND name IN ($2, $3)`,
        [tenant.company_id, LISTED, TICKED],
      )
    ).map((a) => a.name),
  );
  if (!had.has(LISTED)) {
    await e2eQuery(
      `INSERT INTO asset (company_id, name, type) VALUES ($1, $2, 'process')`,
      [tenant.company_id, LISTED],
    );
  }
  return async () => {
    const added = [LISTED, TICKED].filter((name) => !had.has(name));
    await e2eQuery(`DELETE FROM asset WHERE company_id = $1 AND name = ANY($2)`, [
      tenant.company_id,
      added,
    ]);
  };
}

async function keepSuppliers(tenant: Tenant): Promise<Undo> {
  return async () => {
    await e2eQuery(`DELETE FROM supplier WHERE customer_company_id = $1 AND name = $2`, [
      tenant.company_id,
      SUPPLIER,
    ]);
  };
}

test.describe("durchgang lists", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await seedRegister(tenant),
      await keepSuppliers(tenant),
      await payFor(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("shows what the register holds ticked, and adds what is ticked next", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/nis2/2.2?s=${PROCESSES_SCREEN}`);
    const listed = page.getByRole("button", { name: LISTED, exact: true });
    await expect(listed).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });

    // What is on the register stays: the walk only ever adds.
    await listed.click();
    await expect(listed).toHaveAttribute("aria-pressed", "true");

    const ticked = page.getByRole("button", { name: TICKED, exact: true });
    if ((await ticked.getAttribute("aria-pressed")) !== "true") await ticked.click();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect.poll(() => assetNamed(tenant, TICKED)).toBe(1);
    expect(await assetNamed(tenant, LISTED)).toBe(1);
  });

  test("adds a supplier as one line with what it does", async ({ page }) => {
    await page.goto(`/de/durchgang/nis2/5.1?s=${SUPPLIERS_SCREEN}`);
    const name = page.getByLabel("Lieferant", { exact: true });
    await expect(name).toBeVisible({ timeout: 30_000 });

    await name.fill(SUPPLIER);
    await page.getByLabel("Was er für Sie tut").fill(SUPPLIER_DOES);
    await page.getByLabel("Was er für Sie tut").press("Enter");

    await expect(page.getByText(SUPPLIER_DOES)).toBeVisible();
    await expect(name).toHaveValue("");
    const [row] = await e2eQuery<{ description: string | null }>(
      `SELECT description FROM supplier WHERE customer_company_id = $1 AND name = $2`,
      [tenant.company_id, SUPPLIER],
    );
    expect(row?.description).toBe(SUPPLIER_DOES);
  });
});
