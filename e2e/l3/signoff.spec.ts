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
import { gotoRequirement, makeSignable, signOffViaUi } from "../lib/journey";

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

/**
 * Withdrawing a sign-off. Until this existed there was no way back from
 * "completed" in the UI at all — the whole action bar disappeared once a
 * requirement was signed, so a premature sign-off was permanent.
 *
 * Runs after the two sign-off tests above (Playwright keeps file order), so
 * SINGLE_TARGET is genuinely signed when this starts.
 */
test("reopen: withdrawing a sign-off clears the attestation and keeps the history", async ({
  page,
}) => {
  const before = await statusRow(SINGLE_TARGET);
  expect(before.status, "precondition: signed by the earlier test").toBe("completed");
  expect(before.signed_off_by).not.toBeNull();

  const chainBefore = await e2eQuery<{ n: string }>(
    `SELECT count(*)::text AS n FROM sign_off_history WHERE status_id = $1`,
    [before.id],
  );

  await gotoRequirement(page, SINGLE_TARGET);
  const reopen = page.getByTestId("reopen-button");
  await expect(reopen, "a completed requirement offers a way back").toBeVisible({
    timeout: 20_000,
  });
  await reopen.click();

  const [resp] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("assessment.reopenRequirement") &&
        r.request().method() === "POST",
      { timeout: 20_000 },
    ),
    page.getByTestId("reopen-confirm").click(),
  ]);
  expect(resp.ok(), `reopenRequirement HTTP ${resp.status()}`).toBe(true);

  // Every evidentiary column clears together. signed_off_by is the one that
  // decides whether the rest of the system reads this row as signed, and
  // sign_off_snapshot is what makes ReviewDashboard and the PDF render an
  // attestation — a half-cleared row would keep showing one for a
  // requirement nobody currently vouches for.
  const after = await e2eQuery<{
    status: string;
    signed_off_by: string | null;
    signed_off_at: string | null;
    signed_off_role: string | null;
    signed_off_template_version: number | null;
    sign_off_snapshot: unknown;
    completed_by: string | null;
  }>(
    `SELECT status, signed_off_by, signed_off_at, signed_off_role,
            signed_off_template_version, sign_off_snapshot, completed_by
       FROM company_requirement_status WHERE id = $1`,
    [before.id],
  );
  expect(after[0].status).toBe("in_progress");
  expect(after[0].signed_off_by).toBeNull();
  expect(after[0].signed_off_at).toBeNull();
  expect(after[0].signed_off_role).toBeNull();
  expect(after[0].signed_off_template_version).toBeNull();
  expect(after[0].sign_off_snapshot).toBeNull();
  expect(after[0].completed_by).toBeNull();

  // Per-signer rows clear too. Left signed, the next single signature would
  // close an N-of-M requirement on the strength of stale attestations.
  const stillSigned = await e2eQuery<{ n: string }>(
    `SELECT count(*)::text AS n FROM requirement_assignment
      WHERE status_id = $1 AND signed_off_at IS NOT NULL`,
    [before.id],
  );
  expect(stillSigned[0].n).toBe("0");

  // The chain is append-only: withdrawing is an event in the record, not a
  // deletion from it. An auditor must still see that this was signed.
  const chainAfter = await e2eQuery<{ n: string }>(
    `SELECT count(*)::text AS n FROM sign_off_history WHERE status_id = $1`,
    [before.id],
  );
  expect(
    Number(chainAfter[0].n),
    "sign_off_history must survive a withdrawal",
  ).toBe(Number(chainBefore[0].n));
  expect(Number(chainAfter[0].n)).toBeGreaterThan(0);

  // And the withdrawal itself is recorded. Asserted against the table rather
  // than the UI because logAudit swallows its own failures: an insert that
  // never lands is invisible to Playwright (see the entity_id/uuid bug that
  // dropped every sign_off_invalidated row for two weeks).
  const audit = await e2eQuery<{ n: string }>(
    `SELECT count(*)::text AS n FROM audit_log WHERE action = 'requirement.sign_off_withdrawn'`,
  );
  expect(Number(audit[0].n), "audit_log records the withdrawal").toBeGreaterThan(0);

  // Back in the UI the requirement is signable again, which is the point.
  await page.reload();
  await expect(page.getByTestId("sign-off-button")).toBeVisible({ timeout: 20_000 });
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
