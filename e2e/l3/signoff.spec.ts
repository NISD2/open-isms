/**
 * L3 sign-off: the evidentiary core. Single-signer completion, N-of-M
 * across two real user sessions, tamper-evident chain rows, and the
 * (currently dormant) cross-framework carry-over.
 *
 * Runs after l1/l2 in the same hermetic run, so the intake specs have
 * already saved answers and every target is signable (saving answers
 * flips completed requirements back to in_progress by design).
 */
import { test, expect, type Page } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { E2E_STORAGE_STATE_MANAGER, E2E_MANAGER_EMAIL, E2E_USER_EMAIL } from "../lib/env";
import { makeSignable, signOffViaUi } from "../lib/journey";

const SINGLE_TARGET = "3.1"; // incident lead — no required role, admin signs alone
const NOFM_TARGET = "1.4"; // personal liability — CEO-role, two assigned signers

async function statusRow(code: string): Promise<{ id: string; status: string; signed_off_by: string | null }> {
  const rows = await e2eQuery<{ id: string; status: string; signed_off_by: string | null }>(
    `SELECT s.id, s.status, s.signed_off_by
       FROM company_requirement_status s
       JOIN requirement r ON r.id = s.requirement_id
       JOIN company_assessment a ON a.id = s.assessment_id
       JOIN compliance_framework f ON f.id = a.framework_id
      WHERE f.code = 'nis2' AND r.code = $1`,
    [code],
  );
  expect(rows.length, `status row for ${code}`).toBe(1);
  return rows[0];
}

test("single signer: admin sign-off completes the requirement", async ({ page }) => {
  await makeSignable(page, SINGLE_TARGET);
  const before = await statusRow(SINGLE_TARGET);
  expect(before.status).not.toBe("completed");

  await signOffViaUi(page, SINGLE_TARGET);

  const after = await statusRow(SINGLE_TARGET);
  expect(after.status).toBe("completed");
  expect(after.signed_off_by).not.toBeNull();

  // The sign-off button is gone after a reload (completed state).
  await page.reload();
  await expect(page.getByTestId("sign-off-button")).toHaveCount(0);
});

test("N-of-M: two assigned signers, partial then complete", async ({ page, browser }) => {
  const status = await statusRow(NOFM_TARGET);

  // Assign both users (assignment seeding via SQL; the assignment UI gets
  // its own spec with the team flow).
  await e2eQuery(
    `INSERT INTO requirement_assignment (status_id, user_id, assigned_by)
     SELECT $1, u.id, u.id FROM "user" u WHERE u.email = ANY($2)
     ON CONFLICT (status_id, user_id) DO NOTHING`,
    [status.id, [E2E_USER_EMAIL, E2E_MANAGER_EMAIL]],
  );

  // Members act only on categories they own (admins bypass); make the
  // manager the GOV category owner, as a team invite would.
  await e2eQuery(
    `INSERT INTO category_assignment (assessment_id, category_id, user_id, assigned_by)
     SELECT s.assessment_id, r.category_id, mu.id, mu.id
       FROM company_requirement_status s
       JOIN requirement r ON r.id = s.requirement_id
       CROSS JOIN "user" mu
      WHERE s.id = $1 AND mu.email = $2
     ON CONFLICT (assessment_id, category_id) DO UPDATE SET user_id = EXCLUDED.user_id`,
    [status.id, E2E_MANAGER_EMAIL],
  );

  // Signer 1 (admin): partial — status stays open, 1 of 2 recorded.
  await signOffViaUi(page, NOFM_TARGET);
  const partial = await statusRow(NOFM_TARGET);
  expect(partial.status).toBe("in_progress");
  const signedCount = await e2eQuery<{ n: string }>(
    `SELECT count(*)::text AS n FROM requirement_assignment WHERE status_id = $1 AND signed_off_at IS NOT NULL`,
    [status.id],
  );
  expect(signedCount[0].n).toBe("1");

  // The journey board shows the partial sign-off (1/2) on the node.
  await page.goto("/de/journey");
  await expect(page.getByTestId(`journey-node-${NOFM_TARGET}`)).toContainText("1/2");

  // Signer 2 (management member, real second session): completes it.
  const managerContext = await browser.newContext({ storageState: E2E_STORAGE_STATE_MANAGER });
  const managerPage = await managerContext.newPage();
  await signOffViaUi(managerPage, NOFM_TARGET);
  await managerContext.close();

  const done = await statusRow(NOFM_TARGET);
  expect(done.status).toBe("completed");
});

test("sign-off chain: append-only history rows exist for both sign-offs", async () => {
  for (const code of [SINGLE_TARGET, NOFM_TARGET]) {
    const status = await statusRow(code);
    const rows = await e2eQuery<{ version: number; checksum: string | null }>(
      `SELECT version, checksum FROM sign_off_history WHERE status_id = $1 ORDER BY version`,
      [status.id],
    );
    expect(rows.length, `chain rows for ${code}`).toBeGreaterThan(0);
    rows.forEach((r, i) => {
      expect(Number(r.version), `versions strictly increase for ${code}`).toBe(i + 1);
      expect(r.checksum, `checksum present for ${code}`).toBeTruthy();
    });
  }
});

test("cross-framework carry-over credits the linked ISO requirement", async () => {
  const pairs = await e2eQuery<{ n: string }>(
    `SELECT count(*)::text AS n FROM requirement_satisfaction`,
  );
  test.skip(
    pairs[0].n === "0",
    "requirement_satisfaction is empty in the default seed — carry-over is dormant (recorded coverage gap; seeding the NIS2<->ISO pairs is a product decision)",
  );

  // When pairs exist: signing SINGLE_TARGET must credit its linked pair.
  const credited = await e2eQuery<{ status: string }>(
    `SELECT s.status
       FROM requirement_satisfaction rs
       JOIN requirement src ON src.id IN (rs.requirement_a_id, rs.requirement_b_id) AND src.code = $1
       JOIN requirement_category rc ON rc.id = src.category_id
       JOIN compliance_framework f ON f.id = rc.framework_id AND f.code = 'nis2'
       JOIN requirement dst ON dst.id IN (rs.requirement_a_id, rs.requirement_b_id) AND dst.id <> src.id
       JOIN company_requirement_status s ON s.requirement_id = dst.id`,
    [SINGLE_TARGET],
  );
  for (const row of credited) {
    expect(["completed", "approved"]).toContain(row.status);
  }
});
