/**
 * L2 GDPR walkthrough, through the real UI against real Postgres:
 *
 *   - a supplier that answered the questionnaire: its answers are offered for its role and its
 *     transfers on G-DPA.1, and only once the company takes them over are they recorded on its
 *     supplier row;
 *   - a processing activity gets its lawful basis on G-ROP.1, and legitimate interests are
 *     accepted only with the interest named;
 *   - an activity names the suppliers that receive its data, shows their transfers as G-DPA.1
 *     recorded them, and the record page lists them;
 *   - an item NIS 2 work gives a head start says so on its first screen, and G-DPO.1 shows its
 *     examples.
 *
 * Later layers read this tenant, so everything the file writes is put back (`e2e/lib/durchgang.ts`).
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
const WHO_SCREEN = 8;

const SUPPLIER = "E2E Lohnbüro GmbH";
const ACTIVITY = "E2E Lohnabrechnung";
// What the record says of the supplier's transfers once G-DPA.1 took over its answer.
const THROUGH = `${SUPPLIER}: außerhalb des EWR (US), Grundlage: Standardvertragsklauseln (Art. 46)`;

const GDPR_COLUMNS = `relationship_type, processes_personal_data, processor_checked_at, dpa_concluded,
  international_transfer, transfer_mechanism, transfer_countries, transfer_checked_at,
  subprocessor_authorisation`;

interface SupplierGdpr {
  readonly id: string;
  readonly name: string;
  readonly relationship_type: string | null;
  readonly processes_personal_data: boolean | null;
  readonly processor_checked_at: Date | null;
  readonly international_transfer: boolean | null;
  readonly transfer_mechanism: string | null;
  readonly transfer_countries: string | null;
  readonly transfer_checked_at: Date | null;
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
                transfer_mechanism = $7, subprocessor_authorisation = $8, transfer_checked_at = $9,
                transfer_countries = $10
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
          row.transfer_checked_at,
          row.transfer_countries,
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

const pressed = (row: Locator, name: string, on = true) =>
  expect(row.getByRole("button", { name, exact: true })).toHaveAttribute(
    "aria-pressed",
    String(on),
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

  test("a supplier's own answer is offered for its role, and recorded once taken over", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/dsgvo/G-DPA.1?s=${ROLE_SCREEN}`);
    const ours = page.getByRole("listitem").filter({ hasText: SUPPLIER });
    await expect(ours).toBeVisible({ timeout: 30_000 });
    await expect(ours.getByText("Aus seinem Fragebogen")).toBeVisible();
    await expect(
      ours.getByText("Bietet einen Standardvertrag zur Auftragsverarbeitung an"),
    ).toBeVisible();
    // The supplier's own claim is a suggestion until the company takes it over.
    await pressed(ours, "Verarbeitet Daten in unserem Auftrag", false);
    await page.getByRole("button", { name: /^Seine Antworten übernehmen/ }).click();
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

  test("the transfer basis and countries the supplier stated are offered, and recorded once taken over", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/dsgvo/G-DPA.1?s=${WHERE_SCREEN}`);
    const ours = page.getByRole("listitem").filter({ hasText: SUPPLIER });
    await expect(ours).toBeVisible({ timeout: 30_000 });
    await expect(
      ours.getByText(
        "Übermittelt außerhalb des EWR auf Grundlage von Standardvertragsklauseln",
      ),
    ).toBeVisible();
    // The countries it named outside the EEA, from "DE, US".
    await expect(ours.getByLabel("In welche Länder")).toHaveValue("US");
    // Nothing is recorded while the answer is only the supplier's.
    await expect(enabledNext(page)).toHaveCount(0);
    await page.getByRole("button", { name: /^Seine Antworten übernehmen/ }).click();

    await enabledNext(page).click();
    await expect
      .poll(async () => {
        const row = (await suppliersOf(tenant)).find((s) => s.name === SUPPLIER);
        return (
          row && [
            row.international_transfer,
            row.transfer_mechanism,
            row.transfer_countries,
            !!row.transfer_checked_at,
          ]
        );
      })
      .toEqual([true, "sccs", "US", true]);
  });

  test("an activity takes its lawful basis; legitimate interests need the interest named", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/dsgvo/G-ROP.1?s=${BASIS_SCREEN}`);
    const card = page.getByRole("listitem").filter({ hasText: ACTIVITY });
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(enabledNext(page)).toHaveCount(0);

    await card.getByRole("button", { name: /^Ein Vertrag mit der Person/ }).click();
    await card.getByRole("button", { name: /^Berechtigte Interessen \(f\)/ }).click();
    // (f) alone is not an answer: the interest has to be written down.
    await expect(enabledNext(page)).toHaveCount(0);
    await card
      .getByLabel("Welches Interesse, und warum es nicht überwogen wird")
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

  test("an activity names the suppliers receiving its data, with their transfers read from G-DPA.1", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/dsgvo/G-ROP.1?s=${WHO_SCREEN}`);
    const card = page.getByRole("listitem").filter({ hasText: ACTIVITY });
    await expect(card).toBeVisible({ timeout: 30_000 });

    await card.getByRole("button", { name: SUPPLIER, exact: true }).click();
    // Recorded once for the supplier on G-DPA.1, shown here, never asked again.
    await expect(card.getByText(THROUGH)).toBeVisible();
    await card.getByLabel("Empfänger", { exact: true }).fill("Steuerberater, Finanzamt");
    const other = card.getByRole("group", { name: "Andere Wege aus dem EWR" });
    await other.getByRole("button", { name: "Nein", exact: true }).click();

    await enabledNext(page).click();
    await expect
      .poll(async () => {
        const rows = await e2eQuery<{ name: string }>(
          `SELECT s.name FROM processing_activity_supplier l
             JOIN processing_activity a ON a.id = l.activity_id
             JOIN supplier s ON s.id = l.supplier_id
            WHERE a.company_id = $1 AND a.name = $2`,
          [tenant.company_id, ACTIVITY],
        );
        return rows.map((r) => r.name);
      })
      .toEqual([SUPPLIER]);

    await page.goto("/de/processing-activities");
    const row = page.getByRole("row").filter({ hasText: ACTIVITY });
    await expect(row.getByText(THROUGH)).toBeVisible({ timeout: 30_000 });
  });

  test("an item with a head start from NIS 2 shows it; G-DPO.1 shows its examples", async ({
    page,
  }) => {
    await page.goto("/de/durchgang/dsgvo/G-DPA.1?s=0");
    const start = page
      .locator("section")
      .filter({ hasText: "Schon da aus Ihrem NIS 2 Durchgang" });
    await expect(start).toBeVisible({ timeout: 30_000 });
    await expect(start.getByText("5.1", { exact: true })).toBeVisible();
    await expect(start.getByText("5.2", { exact: true })).toBeVisible();

    // basics, learn, examples, ...
    await page.goto("/de/durchgang/dsgvo/G-DPO.1?s=2");
    await expect(page.getByRole("heading", { name: "Wer benennen muss" })).toBeVisible({
      timeout: 30_000,
    });
  });
});
