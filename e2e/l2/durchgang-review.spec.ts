/**
 * L2 Durchgang management review (7.3): the review is entered in the management review register,
 * and the drafts the walk wrote are approved in one sitting, through the real UI against real
 * Postgres. The approval sets status and start day only, never the sign-off columns.
 *
 * Cleanup removes the review and the draft this file adds, because later layers read this tenant
 * (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  keepPolicies,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
  walkPolicy,
} from "../lib/durchgang";

// learn, inputs, risk map, example, review, approve, done.
const REVIEW_SCREEN = 4;
const APPROVE_SCREEN = 5;
const TYPE = "cryptography";
const DECISION = "E2E Konzepte freigegeben";

/** A draft Kryptokonzept on 9.1, as the walk would have written it. */
async function seedDraft(tenant: Tenant): Promise<void> {
  await e2eQuery(
    `INSERT INTO policy (company_id, requirement_id, title, type, content)
     SELECT $1, r.id, $2, $3, 'E2E'
       FROM requirement r WHERE r.code = '9.1'`,
    [tenant.company_id, `Kryptokonzept der ${tenant.company_name}`, TYPE],
  );
}

async function removeReviews(tenant: Tenant): Promise<Undo> {
  return async () => {
    await e2eQuery(
      `DELETE FROM management_review WHERE company_id = $1 AND decisions = $2`,
      [tenant.company_id, DECISION],
    );
  };
}

test.describe("durchgang management review", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await keepPolicies(tenant, TYPE),
      await removeReviews(tenant),
      await payFor(tenant),
    ];
    await seedDraft(tenant);
  });

  test.afterAll(() => undoAll(undos));

  test("enters the review in the management review register", async ({ page }) => {
    await page.goto(`/de/durchgang/7.3?s=${REVIEW_SCREEN}`);
    const date = page.getByLabel("Datum");
    await expect(date).toBeVisible({ timeout: 30_000 });

    await date.fill("2026-10-01");
    await page.getByLabel("Wer teilgenommen hat").fill("Anna Beispiel, Jonas Muster");
    await page.getByLabel("Entschieden").fill(DECISION);
    await page.getByRole("button", { name: "Hinzufügen" }).click();

    await expect
      .poll(async () => {
        const [row] = await e2eQuery<{ review_date: string; attendees: string }>(
          `SELECT review_date::text, array_to_string(attendees, '|') AS attendees
             FROM management_review WHERE company_id = $1 AND decisions = $2`,
          [tenant.company_id, DECISION],
        );
        return row ?? null;
      })
      .toEqual({ review_date: "2026-10-01", attendees: "Anna Beispiel|Jonas Muster" });
    await expect(
      page.getByText("Noch keine Managementbewertung eingetragen."),
    ).toHaveCount(0);
  });

  test("approves the ticked drafts from the day entered, and never the sign-off columns", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/7.3?s=${APPROVE_SCREEN}`);
    const row = page
      .getByRole("listitem")
      .filter({ hasText: `Kryptokonzept der ${tenant.company_name}` });
    await expect(row).toBeVisible({ timeout: 30_000 });

    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await row.getByRole("button", { name: "Freigegeben" }).click();
    await expect(next).toBeDisabled();
    await page.getByLabel("Tag der Freigabe").fill("2026-10-01");
    await next.click();

    await expect
      .poll(async () => (await walkPolicy(tenant, TYPE))?.status ?? null)
      .toBe("approved");
    const policy = await walkPolicy(tenant, TYPE);
    expect(policy?.effective_from).toBe("2026-10-01");
    expect(policy?.approved_by).toBeNull();
    expect(policy?.approved_at).toBeNull();
    expect(policy?.approver_role).toBeNull();
  });
});
