/**
 * L2 Durchgang incident plan (3.1): the walk writes the company's incident plan from the template,
 * filled in with the answers given on the screens before it, and the signature page approves it,
 * through the real UI against real Postgres.
 *
 * Cleanup removes the policy and the clause choice this file wrote and restores the INC answers,
 * because later layers sign off against this tenant. The tenant is lifted to a paid account for
 * the file and put back afterwards, as in durchgang.spec.ts.
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { E2E_USER_EMAIL } from "../lib/env";

// learn, lead, whom you call, second way example, second way, plan, signature, signed copy, done.
const LEAD_SCREEN = 1;
const SIGNATURE_SCREEN = 6;
const TYPE = "incident_response";

interface Tenant {
  company_id: string;
  billing_account_id: string;
  access_level: string;
}

interface IntakeRow {
  id: string;
  answers: Record<string, unknown> | null;
}

interface PolicyRow {
  title: string;
  content: string | null;
  status: string;
  version: string;
  effective_from: string | null;
  approved_by: string | null;
}

const intakeRows = (companyId: string) =>
  e2eQuery<IntakeRow>(
    `SELECT i.id, i.answers
       FROM company_category_intake i
       JOIN company_assessment a ON a.id = i.assessment_id
       JOIN requirement_category rc ON rc.id = i.category_id
      WHERE a.company_id = $1 AND rc.code = 'INC'`,
    [companyId],
  );

const walkPolicy = async (companyId: string) => {
  const [row] = await e2eQuery<PolicyRow>(
    `SELECT title, content, status, version, effective_from::text, approved_by
       FROM policy WHERE company_id = $1 AND type = $2`,
    [companyId, TYPE],
  );
  return row ?? null;
};

test.describe("durchgang incident plan", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let answersBefore: readonly IntakeRow[];
  let policiesBefore: Set<string>;
  let hadConfig: boolean;

  test.beforeAll(async () => {
    const [row] = await e2eQuery<Tenant>(
      `SELECT c.id AS company_id, b.id AS billing_account_id, b.access_level
         FROM "user" u
         JOIN company c ON c.id = u.company_id
         JOIN billing_account b ON b.id = c.billing_account_id
        WHERE u.email = $1`,
      [E2E_USER_EMAIL],
    );
    if (!row) throw new Error("the e2e tenant has no billing account");
    tenant = row;
    answersBefore = await intakeRows(tenant.company_id);
    policiesBefore = new Set(
      (
        await e2eQuery<{ id: string }>(`SELECT id FROM policy WHERE company_id = $1`, [
          tenant.company_id,
        ])
      ).map((p) => p.id),
    );
    hadConfig =
      (
        await e2eQuery(
          `SELECT 1 FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
          [tenant.company_id, TYPE],
        )
      ).length > 0;
    await e2eQuery(`UPDATE billing_account SET access_level = 'full' WHERE id = $1`, [
      tenant.billing_account_id,
    ]);
  });

  test.afterAll(async () => {
    const policies = await e2eQuery<{ id: string }>(
      `SELECT id FROM policy WHERE company_id = $1`,
      [tenant.company_id],
    );
    for (const { id } of policies.filter((p) => !policiesBefore.has(p.id))) {
      await e2eQuery(`DELETE FROM policy WHERE id = $1`, [id]);
    }
    if (!hadConfig) {
      await e2eQuery(
        `DELETE FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
        [tenant.company_id, TYPE],
      );
    }
    const kept = new Set(answersBefore.map((r) => r.id));
    for (const row of answersBefore) {
      await e2eQuery(`UPDATE company_category_intake SET answers = $2 WHERE id = $1`, [
        row.id,
        JSON.stringify(row.answers ?? {}),
      ]);
    }
    for (const row of await intakeRows(tenant.company_id)) {
      if (!kept.has(row.id)) {
        await e2eQuery(`DELETE FROM company_category_intake WHERE id = $1`, [row.id]);
      }
    }
    await e2eQuery(`UPDATE billing_account SET access_level = $2 WHERE id = $1`, [
      tenant.billing_account_id,
      tenant.access_level,
    ]);
  });

  test("the plan is written with the answers given on the screens before it", async ({
    page,
  }) => {
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await page.goto(`/de/durchgang/3.1?s=${LEAD_SCREEN}`);
    const lead = page.locator("#dg-incidentLead");
    await expect(lead).toBeVisible({ timeout: 30_000 });
    await lead.fill("Anna Weber");
    await next.click();

    await page.locator("#dg-itEmergencyNumber").fill("Durchwahl 400");
    await page
      .locator("#dg-incidentEscalationContacts")
      .fill("Geschäftsführung: Jonas Muster");
    await next.click();
    await next.click();
    await page.locator("#dg-secureCommsChannel").fill("Threema Work");
    await next.click();

    // The preview is filled in from this visit's answers, before the save has landed.
    await expect(
      page.getByText("Anna Weber leitet die Bewältigung", { exact: false }),
    ).toBeVisible();
    const card = page.getByRole("button", { name: "IT-Notfallkarte" });
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await next.click();

    await expect
      .poll(async () => (await walkPolicy(tenant.company_id))?.content ?? "")
      .toContain("## 9. IT-Notfallkarte");
    const content = (await walkPolicy(tenant.company_id))?.content ?? "";
    expect(content).toContain("Anna Weber leitet die Bewältigung eines Vorfalls.");
    expect(content).toContain("ruft sofort die IT-Notfallnummer Durchwahl 400 an.");
    expect(content).toContain("ruft die Leitung an: Geschäftsführung: Jonas Muster.");
    expect(content).toContain("erreichen wir uns über: Threema Work.");
    expect(content).toContain("mit unserer Nummer Durchwahl 400.");
    expect(content).not.toContain("{");
  });

  test("the signature approves the plan, without the sign-off columns", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/3.1?s=${SIGNATURE_SCREEN}`);
    const version = page.locator("#dg-incidentPlanVersion");
    await expect(version).toBeVisible({ timeout: 30_000 });
    await version.fill("1.0");
    await page.locator("#dg-incidentPlanApprovalDate").fill("2026-10-01");
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await walkPolicy(tenant.company_id))?.status ?? null)
      .toBe("approved");
    expect(await walkPolicy(tenant.company_id)).toMatchObject({
      version: "1.0",
      effective_from: "2026-10-01",
      approved_by: null,
    });
  });
});
