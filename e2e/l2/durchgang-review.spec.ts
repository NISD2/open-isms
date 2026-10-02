/**
 * L2 Durchgang management review (7.3): the review is entered in the management review register,
 * and management approves the drafts the walk wrote, signed in with its own account, through the
 * real UI against real Postgres. The approval records who approved, when and in which role, and
 * signs off the items waiting for it as management, so the journey sees them done: 12.2, filled in
 * through the walk, whose single sign-off on its page names the CISO. The management review itself
 * (7.3) is signed last, only by the approval that leaves no other walk item open.
 *
 * Cleanup removes the review and the draft this file adds, puts back the e2e user's role and
 * undoes the sign-offs, because later layers read this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { APPROVAL_SCREEN, WALK } from "@/lib/durchgang";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  e2eUserId,
  fillWalkItem,
  keepJobTitle,
  keepPolicies,
  keepSignOffs,
  payFor,
  requirementStatus,
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
/** A walk item filled in and waiting, whose own sign-off role is the CISO, not management. */
const FILLED = "12.2";
const FILLED_HEADLINE = "Beim BSI registrieren";
/** The item that holds the approval: the management review, signed last. */
const REVIEW_CODE = APPROVAL_SCREEN?.code ?? "7.3";
const REVIEW_HEADLINE = "Die Managementbewertung festhalten";
/** Today in Berlin: the review must be within the last year to count, and an approval starts today. */
const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
  new Date(),
);

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
      await keepSignOffs(tenant),
      // After keepSignOffs, so its snapshot holds 12.2 as it was.
      await fillWalkItem(tenant, FILLED),
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
    await page.goto(`/de/durchgang/nis2/7.3?s=${REVIEW_SCREEN}`);
    const date = page.getByLabel("Datum");
    await expect(date).toBeVisible({ timeout: 30_000 });

    await date.fill(TODAY);
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
      .toEqual({ review_date: TODAY, attendees: "Anna Beispiel|Jonas Muster" });
    await expect(
      page.getByText("Noch keine Managementbewertung eingetragen."),
    ).toHaveCount(0);
  });

  test("outside management the screen sends the documents on; management approves them as itself", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/nis2/7.3?s=${APPROVE_SCREEN}`);
    const row = page
      .getByRole("listitem")
      .filter({ hasText: `Kryptokonzept der ${tenant.company_name}` });
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.getByText("Wartet auf die Geschäftsführung")).toBeVisible();
    // The item the walk filled in waits for management's sign-off with the documents. 7.3 does
    // not: other walk items are still open in this tenant.
    await expect(page.getByText("Diese Punkte warten auf Freigabe")).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: FILLED_HEADLINE }),
    ).toBeVisible();
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
    expect(await walkPolicy(tenant, TYPE)).toMatchObject({
      effective_from: TODAY,
      version: TODAY,
      approved_by: await e2eUserId(),
      approver_role: "ceo",
    });
    expect((await walkPolicy(tenant, TYPE))?.approved_at).not.toBeNull();
    // Management signs the CISO's item in the same click: the walk's one signature at the end.
    // The documents commit first, the signatures after them.
    await expect
      .poll(async () => await requirementStatus(tenant, FILLED))
      .toEqual({ status: "completed", signed_off_role: "ceo" });
    // The management review is signed last, and other walk items are still open.
    expect((await requirementStatus(tenant, "7.3"))?.status).not.toBe("completed");
    await expect(page.getByRole("button", { name: "Weiter", exact: true })).toBeEnabled();
  });

  test("signs the management review last, once no other walk item is open", async ({
    page,
  }) => {
    // Everything else finished: not applicable stands in for signed off, both count.
    await e2eQuery(
      `UPDATE company_requirement_status s SET status = 'not_applicable'
         FROM company_assessment a, compliance_framework f, requirement r
        WHERE a.id = s.assessment_id AND f.id = a.framework_id AND r.id = s.requirement_id
          AND a.company_id = $1 AND f.code = 'nis2'
          AND r.code = ANY($2::text[]) AND s.status <> 'completed'`,
      [tenant.company_id, WALK.map((item) => item.code).filter((c) => c !== REVIEW_CODE)],
    );

    await page.goto(`/de/durchgang/nis2/7.3?s=${APPROVE_SCREEN}`);
    await expect(
      page.getByRole("listitem").filter({ hasText: REVIEW_HEADLINE }),
    ).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /Punkte? freigeben/ }).click();

    await expect
      .poll(async () => await requirementStatus(tenant, REVIEW_CODE))
      .toEqual({ status: "completed", signed_off_role: "ceo" });
  });

  test("management's own page lists the documents with who approved them", async ({
    page,
  }) => {
    await page.goto("/de/durchgang/nis2/freigabe");
    const row = page
      .getByRole("listitem")
      .filter({ hasText: `Kryptokonzept der ${tenant.company_name}` });
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.getByText(/Freigegeben am/)).toBeVisible();
  });
});
