/**
 * L2 GDPR walkthrough, through the real UI against real Postgres:
 *
 *   - a supplier that answered the questionnaire: its answers preselect its role and its
 *     transfers on G-DPA.1, and moving on records them on the customer's supplier row;
 *   - a processing activity gets its lawful basis on G-ROP.1, and legitimate interests are
 *     accepted only with the interest named;
 *   - an item NIS 2 work gives a head start says so on its first screen, and G-DPO.1 shows its
 *     examples.
 *
 * Later layers read this tenant, so everything the file writes is put back (`e2e/lib/durchgang.ts`).
 * New GDPR copy is English first: a German page shows it in English until it is translated.
 */
import { expect, type Locator, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  enabledNext,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";

// G-DPA.1: learn, who is who, role, contract, where, done.
const ROLE_SCREEN = 2;
const WHERE_SCREEN = 4;
// G-ROP.1: learn, sample, four catalogue slices, what, basis, who, keep, done.
const BASIS_SCREEN = 7;

const SUPPLIER = "E2E Lohnbüro GmbH";
const ACTIVITY = "E2E Lohnabrechnung";

const GDPR_COLUMNS = `relationship_type, processes_personal_data, processor_checked_at, dpa_concluded,
  international_transfer, transfer_mechanism, subprocessor_authorisation`;

interface SupplierGdpr {
  readonly id: string;
  readonly name: string;
  readonly relationship_type: string | null;
  readonly processes_personal_data: boolean | null;
  readonly processor_checked_at: Date | null;
  readonly international_transfer: boolean | null;
  readonly transfer_mechanism: string | null;
}

const suppliersOf = (tenant: Tenant) =>
  e2eQuery<SupplierGdpr>(
    `SELECT id, name, ${GDPR_COLUMNS} FROM supplier WHERE customer_company_id = $1`,
    [tenant.company_id],
  );

/**
 * Adds a supplier company that answered the GDPR questions of the questionnaire and links it to
 * the tenant as an active supplier; puts every other supplier's GDPR columns back afterwards.
 */
async function answeringSupplier(tenant: Tenant): Promise<Undo> {
  const before = await e2eQuery<Record<string, unknown> & { id: string }>(
    `SELECT id, ${GDPR_COLUMNS} FROM supplier WHERE customer_company_id = $1`,
    [tenant.company_id],
  );
  const [company] = await e2eQuery<{ id: string; billing_account_id: string }>(
    `WITH account AS (INSERT INTO billing_account DEFAULT VALUES RETURNING id)
     INSERT INTO company (name, legal_name, sector, entity_type, acts_as_supplier, activated_at,
                          country, billing_account_id, processes_customer_data,
                          data_processing_agreement, data_processing_locations,
                          personal_data_transfers, subprocessor_engagement,
                          breach_notice_to_controller)
     SELECT $1, $1, 'ict', 'important', true, NOW(), 'DE', account.id, true,
            'available', 'DE, US', 'sccs', 'general', true FROM account
     RETURNING id, billing_account_id`,
    [SUPPLIER],
  );
  if (!company) throw new Error("the supplier company was not created");
  await e2eQuery(
    `INSERT INTO supplier (name, customer_company_id, supplier_company_id, status)
     VALUES ($1, $2, $3, 'active')`,
    [SUPPLIER, tenant.company_id, company.id],
  );
  return async () => {
    await e2eQuery(`DELETE FROM supplier WHERE customer_company_id = $1 AND name = $2`, [
      tenant.company_id,
      SUPPLIER,
    ]);
    await e2eQuery(`DELETE FROM company WHERE id = $1`, [company.id]);
    await e2eQuery(`DELETE FROM billing_account WHERE id = $1`, [
      company.billing_account_id,
    ]);
    for (const row of before) {
      await e2eQuery(
        `UPDATE supplier SET relationship_type = $2, processes_personal_data = $3,
                processor_checked_at = $4, dpa_concluded = $5, international_transfer = $6,
                transfer_mechanism = $7, subprocessor_authorisation = $8
          WHERE id = $1`,
        [
          row.id,
          row.relationship_type,
          row.processes_personal_data,
          row.processor_checked_at,
          row.dpa_concluded,
          row.international_transfer,
          row.transfer_mechanism,
          row.subprocessor_authorisation,
        ],
      );
    }
  };
}

/** Adds one activity to the tenant's record and removes every activity the file leaves. */
async function oneActivity(tenant: Tenant): Promise<Undo> {
  const kept = (
    await e2eQuery<{ id: string }>(
      `SELECT id FROM processing_activity WHERE company_id = $1`,
      [tenant.company_id],
    )
  ).map((r) => r.id);
  await e2eQuery(`INSERT INTO processing_activity (company_id, name) VALUES ($1, $2)`, [
    tenant.company_id,
    ACTIVITY,
  ]);
  return async () => {
    await e2eQuery(
      `DELETE FROM processing_activity WHERE company_id = $1 AND NOT (id = ANY($2::uuid[]))`,
      [tenant.company_id, kept],
    );
  };
}

const pressed = (row: Locator, name: string) =>
  expect(row.getByRole("button", { name, exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

test.describe("GDPR walkthrough", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await payFor(tenant),
      await answeringSupplier(tenant),
      await oneActivity(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("a supplier's own answers preselect its role, and moving on records it", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/dsgvo/G-DPA.1?s=${ROLE_SCREEN}`);
    const ours = page.getByRole("listitem").filter({ hasText: SUPPLIER });
    await expect(ours).toBeVisible({ timeout: 30_000 });
    await expect(ours.getByText("From their questionnaire")).toBeVisible();
    await expect(
      ours.getByText("Offers a standard data processing agreement"),
    ).toBeVisible();
    await pressed(ours, "Verarbeitet Daten in unserem Auftrag");

    // Every other supplier still needs an answer before the screen is complete.
    const others = page
      .getByRole("listitem")
      .filter({ hasNotText: SUPPLIER })
      .filter({
        has: page.getByRole("button", { name: "Bekommt keine personenbezogenen Daten" }),
      });
    for (const row of await others.all()) {
      await row
        .getByRole("button", { name: "Bekommt keine personenbezogenen Daten" })
        .click();
    }

    await enabledNext(page).click();
    await expect
      .poll(async () => {
        const row = (await suppliersOf(tenant)).find((s) => s.name === SUPPLIER);
        return (
          row && [
            row.relationship_type,
            row.processes_personal_data,
            !!row.processor_checked_at,
          ]
        );
      })
      .toEqual(["processor", true, true]);
  });

  test("the transfer basis the supplier stated is preselected and recorded", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/dsgvo/G-DPA.1?s=${WHERE_SCREEN}`);
    const ours = page.getByRole("listitem").filter({ hasText: SUPPLIER });
    await expect(ours).toBeVisible({ timeout: 30_000 });
    await expect(
      ours.getByText("Transfers outside the EEA on standard contractual clauses"),
    ).toBeVisible();

    await enabledNext(page).click();
    await expect
      .poll(async () => {
        const row = (await suppliersOf(tenant)).find((s) => s.name === SUPPLIER);
        return row && [row.international_transfer, row.transfer_mechanism];
      })
      .toEqual([true, "sccs"]);
  });

  test("an activity takes its lawful basis; legitimate interests need the interest named", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/dsgvo/G-ROP.1?s=${BASIS_SCREEN}`);
    const card = page.getByRole("listitem").filter({ hasText: ACTIVITY });
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(enabledNext(page)).toHaveCount(0);

    await card.getByRole("button", { name: /^A contract with the person/ }).click();
    await card.getByRole("button", { name: /^Legitimate interests \(f\)/ }).click();
    // (f) alone is not an answer: the interest has to be written down.
    await expect(enabledNext(page)).toHaveCount(0);
    await card
      .getByLabel("Which interest, and why it is not overridden")
      .fill("Keeping payroll data correct across systems.");

    await enabledNext(page).click();
    await expect
      .poll(async () => {
        const [row] = await e2eQuery<{
          legal_bases: string[] | null;
          legitimate_interests: string | null;
        }>(
          // pg returns an array of a custom enum as its text form; cast it to read an array.
          `SELECT legal_bases::text[] AS legal_bases, legitimate_interests FROM processing_activity
            WHERE company_id = $1 AND name = $2`,
          [tenant.company_id, ACTIVITY],
        );
        return row && [row.legal_bases, row.legitimate_interests];
      })
      .toEqual([
        ["contract", "legitimate_interests"],
        "Keeping payroll data correct across systems.",
      ]);
  });

  test("an item with a head start from NIS 2 shows it; G-DPO.1 shows its examples", async ({
    page,
  }) => {
    await page.goto("/de/durchgang/dsgvo/G-DPA.1?s=0");
    const start = page
      .locator("section")
      .filter({ hasText: "Already in from your NIS 2 walkthrough" });
    await expect(start).toBeVisible({ timeout: 30_000 });
    await expect(start.getByText("5.1", { exact: true })).toBeVisible();
    await expect(start.getByText("5.2", { exact: true })).toBeVisible();

    // basics, learn, examples, ...
    await page.goto("/de/durchgang/dsgvo/G-DPO.1?s=2");
    await expect(
      page.getByRole("heading", { name: "Who must designate one" }),
    ).toBeVisible({
      timeout: 30_000,
    });
  });
});
