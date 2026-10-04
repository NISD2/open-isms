/**
 * L2 Durchgang supplier agreements (5.2): per supplier, what its paper settles about security and
 * about reporting incidents, through the real UI against real Postgres.
 *
 * The screen asks every supplier on the list, so the spec answers all of them. Cleanup removes the
 * supplier this file adds and puts every other supplier's two contract columns back as they were,
 * because later layers read this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  enabledNext,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";

// learn, example, contracts, done.
const CONTRACTS_SCREEN = 2;
const NAME = "E2E Wartung GmbH";

interface AgreementColumns {
  id: string;
  has_security_clauses: boolean | null;
  has_incident_notification_clause: boolean | null;
}

const agreementsOf = (tenant: Tenant) =>
  e2eQuery<AgreementColumns>(
    `SELECT id, has_security_clauses, has_incident_notification_clause
       FROM supplier WHERE customer_company_id = $1`,
    [tenant.company_id],
  );

/** Puts every supplier's two contract columns back, and removes the supplier this file adds. */
async function keepAgreements(tenant: Tenant): Promise<Undo> {
  const before = await agreementsOf(tenant);
  return async () => {
    await e2eQuery(`DELETE FROM supplier WHERE customer_company_id = $1 AND name = $2`, [
      tenant.company_id,
      NAME,
    ]);
    for (const row of before) {
      await e2eQuery(
        `UPDATE supplier
            SET has_security_clauses = $2, has_incident_notification_clause = $3
          WHERE id = $1`,
        [row.id, row.has_security_clauses, row.has_incident_notification_clause],
      );
    }
  };
}

test.describe("durchgang supplier agreements", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [await keepAgreements(tenant), await payFor(tenant)];
    await e2eQuery(`INSERT INTO supplier (name, customer_company_id) VALUES ($1, $2)`, [
      NAME,
      tenant.company_id,
    ]);
  });

  test.afterAll(() => undoAll(undos));

  test("records per supplier what is agreed, and names each one in the trail", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/nis2/5.2?s=${CONTRACTS_SCREEN}`);
    const ours = page.getByRole("listitem").filter({ hasText: NAME });
    await expect(ours).toBeVisible({ timeout: 30_000 });
    await expect(ours.getByText("Nicht bewertet")).toBeVisible();

    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await expect(enabledNext(page)).toHaveCount(0);
    for (const none of await page
      .getByRole("button", { name: "Nichts davon geregelt" })
      .all()) {
      await none.click();
    }
    await ours.getByRole("button", { name: /^Sicherheitsanforderungen/ }).click();
    await ours
      .getByRole("button", { name: "Meldung von Sicherheitsvorfällen an Sie" })
      .click();
    await expect(
      ours.getByRole("button", { name: "Nichts davon geregelt" }),
    ).toHaveAttribute("aria-pressed", "false");
    await next.click();

    await expect
      .poll(async () => {
        const [row] = await e2eQuery<AgreementColumns>(
          `SELECT id, has_security_clauses, has_incident_notification_clause
             FROM supplier WHERE customer_company_id = $1 AND name = $2`,
          [tenant.company_id, NAME],
        );
        return row ?? null;
      })
      .toMatchObject({
        has_security_clauses: true,
        has_incident_notification_clause: true,
      });

    const [status] = await e2eQuery<{ internal_notes: string | null }>(
      `SELECT s.internal_notes
         FROM company_requirement_status s
         JOIN company_assessment a ON a.id = s.assessment_id
         JOIN requirement r ON r.id = s.requirement_id
        WHERE a.company_id = $1 AND r.code = '5.2'`,
      [tenant.company_id],
    );
    expect(status?.internal_notes).toContain(`${NAME}: Sicherheit, Vorfallmeldung`);
  });
});
