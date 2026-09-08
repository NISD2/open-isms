/**
 * L3: changing who holds a compliance role must invalidate the sign-off that
 * attests to the role map.
 *
 * Requirement 1.2 (roles and responsibilities, §30(1) BSIG / CIR 1.2) is
 * backed by moduleRef "team". Every other operational module reverts its
 * requirements when its data changes — fourteen routers call
 * `invalidateModuleSignOffs`, and `team.ts` was the only one that did not.
 * Combined with `team` having no entry in the counter registry, a company
 * could sign off "roles and responsibilities are defined", then re-role or
 * remove the person holding one, and 1.2 stayed green: an attestation
 * outliving the fact it attests to.
 *
 * Runs in l3 so a real sign-off exists to invalidate.
 */
import { test, expect } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { E2E_MANAGER_EMAIL } from "../lib/env";
import { signOffViaUi } from "../lib/journey";

const ROLES_CODE = "1.2";

async function statusOf(code: string): Promise<{ id: string; status: string }> {
  const rows = await e2eQuery<{ id: string; status: string }>(
    `SELECT s.id, s.status
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

async function invalidationRowCount(): Promise<number> {
  const rows = await e2eQuery<{ n: string }>(
    `SELECT count(*)::text AS n FROM audit_log
      WHERE action = 'requirement.sign_off_invalidated'
        AND entity_type = 'module'
        AND description LIKE 'team %'`,
  );
  return Number(rows[0].n);
}

test("re-roling a member reverts the roles-and-responsibilities sign-off", async ({
  page,
}) => {
  await signOffViaUi(page, ROLES_CODE);
  const signed = await statusOf(ROLES_CODE);
  expect(signed.status, "precondition: 1.2 is signed off").toBe("completed");

  const auditBefore = await invalidationRowCount();

  // Change the role map through the real mutation surface. The manager user
  // exists in this tenant from the N-of-M sign-off spec.
  const [manager] = await e2eQuery<{ id: string; job_title: string | null }>(
    `SELECT id, job_title FROM "user" WHERE email = $1`,
    [E2E_MANAGER_EMAIL],
  );
  expect(manager, `${E2E_MANAGER_EMAIL} exists in the e2e tenant`).toBeTruthy();

  const nextRole = manager.job_title === "cto" ? "coo" : "cto";
  const response = await page.request.post("/api/trpc/team.assignRole?batch=1", {
    data: { 0: { json: { userId: manager.id, roleKey: nextRole } } },
  });
  expect(response.ok(), `assignRole HTTP ${response.status()}`).toBe(true);

  // invalidateModuleSignOffs is fire-and-forget, so the write lands after the
  // mutation responds. Poll rather than read once.
  await expect
    .poll(async () => (await statusOf(ROLES_CODE)).status, {
      message: "1.2 returns to needs_review once the role map changes",
      timeout: 15_000,
    })
    .toBe("needs_review");

  // Asserted against the table, not the UI: logAudit swallows its own
  // failures, so a row that never lands is invisible to Playwright. That is
  // exactly how the entity_id/uuid bug dropped every invalidation row for two
  // weeks while the suite stayed green.
  await expect
    .poll(invalidationRowCount, {
      message: "the revert is recorded in the audit trail",
      timeout: 15_000,
    })
    .toBeGreaterThan(auditBefore);
});
