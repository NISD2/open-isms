/**
 * L2 Durchgang management review (7.3): the review is entered in the management review register,
 * and management approves the drafts the walk wrote, signed in with its own account, through the
 * real UI against real Postgres. The approval records who approved, when and in which role.
 *
 * Cleanup removes the review and the draft this file adds and puts back the e2e user's role,
 * because later layers read this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  e2eUserId,
  keepJobTitle,
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
      await keepJobTitle(tenant),
      await payFor(tenant),
    ];
    await seedDraft(tenant);
    // Start outside management, so the screen offers to send the documents on.
    await e2eQuery(
      `UPDATE company_membership m SET job_title = NULL FROM "user" u
        WHERE u.id = m.user_id AND m.company_id = $1 AND u.id = $2`,
      [tenant.company_id, await e2eUserId()],
    );
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

  test("outside management the screen sends the documents on; management approves them as itself", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/7.3?s=${APPROVE_SCREEN}`);
    const row = page
      .getByRole("listitem")
      .filter({ hasText: `Kryptokonzept der ${tenant.company_name}` });
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.getByText("Wartet auf die Geschäftsführung")).toBeVisible();
    await expect(page.getByText("An die Geschäftsführung schicken")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Weiter", exact: true }),
    ).toBeDisabled();

    await page
      .getByRole("button", { name: "Ich gehöre selbst zur Geschäftsführung" })
      .click();
    const approve = page.getByRole("button", { name: /Dokumente? freigeben/ });
    await expect(approve).toBeVisible({ timeout: 30_000 });
    await approve.click();

    await expect
      .poll(async () => (await walkPolicy(tenant, TYPE))?.status ?? null)
      .toBe("approved");
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
      new Date(),
    );
    expect(await walkPolicy(tenant, TYPE)).toMatchObject({
      effective_from: today,
      version: today,
      approved_by: await e2eUserId(),
      approver_role: "ceo",
    });
    expect((await walkPolicy(tenant, TYPE))?.approved_at).not.toBeNull();
    await expect(page.getByRole("button", { name: "Weiter", exact: true })).toBeEnabled();
  });

  test("management's own page lists the documents with who approved them", async ({
    page,
  }) => {
    await page.goto("/de/durchgang/freigabe");
    const row = page
      .getByRole("listitem")
      .filter({ hasText: `Kryptokonzept der ${tenant.company_name}` });
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.getByText(/Freigegeben am/)).toBeVisible();
  });
});
