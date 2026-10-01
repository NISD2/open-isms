/**
 * L2 Durchgang Leitlinie (2.4): the walk writes the company's Leitlinie from the template with a
 * chosen clause, and the signature page approves it, through the real UI against real Postgres.
 *
 * Cleanup removes the policy and the clause choice this file wrote and restores the RSK answers,
 * because later layers sign off against this tenant. The tenant is lifted to a paid account for
 * the file and put back afterwards, as in durchgang.spec.ts.
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { E2E_USER_EMAIL } from "../lib/env";

// learn, Leitlinie, signature, signed copy, done.
const POLICY_SCREEN = 1;
const SIGNATURE_SCREEN = 2;
const TYPE = "information_security";

interface Tenant {
  company_id: string;
  company_name: string;
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
  approved_at: string | null;
  approver_role: string | null;
}

const intakeRows = (companyId: string) =>
  e2eQuery<IntakeRow>(
    `SELECT i.id, i.answers
       FROM company_category_intake i
       JOIN company_assessment a ON a.id = i.assessment_id
       JOIN requirement_category rc ON rc.id = i.category_id
      WHERE a.company_id = $1 AND rc.code = 'RSK'`,
    [companyId],
  );

const walkPolicy = async (companyId: string) => {
  const [row] = await e2eQuery<PolicyRow>(
    `SELECT title, content, status, version, effective_from::text, approved_by, approved_at,
            approver_role
       FROM policy WHERE company_id = $1 AND type = $2`,
    [companyId, TYPE],
  );
  return row ?? null;
};

test.describe("durchgang leitlinie", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let answersBefore: readonly IntakeRow[];
  let policiesBefore: Set<string>;
  let hadConfig: boolean;

  test.beforeAll(async () => {
    const [row] = await e2eQuery<Tenant>(
      `SELECT c.id AS company_id, c.name AS company_name, b.id AS billing_account_id,
              b.access_level
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

  test("stores the base text when no clause is added", async ({ page }) => {
    await page.goto(`/de/durchgang/2.4?s=${POLICY_SCREEN}`);
    await expect(page.getByRole("button", { name: "Schulungen" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await walkPolicy(tenant.company_id))?.status ?? null)
      .toBe("draft");
    const policy = await walkPolicy(tenant.company_id);
    expect(policy?.title).toBe(
      `Leitlinie zur Informationssicherheit der ${tenant.company_name}`,
    );
    expect(policy?.content).toContain("## 7. Bekanntgabe und Inkrafttreten");
    expect(policy?.content).not.toContain("## 8.");
    expect(policy?.content).not.toContain("{company}");
  });

  test("a chosen clause is added to the text and remembered", async ({ page }) => {
    await page.goto(`/de/durchgang/2.4?s=${POLICY_SCREEN}`);
    const training = page.getByRole("button", { name: "Schulungen" });
    await expect(training).toBeVisible({ timeout: 30_000 });

    await training.click();
    await expect(training).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("8. Schulung und Sensibilisierung")).toBeVisible();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await walkPolicy(tenant.company_id))?.content ?? "")
      .toContain("## 8. Schulung und Sensibilisierung");
    const [config] = await e2eQuery<{ config: { clauses: string[] } }>(
      `SELECT config FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
      [tenant.company_id, TYPE],
    );
    expect(config?.config.clauses).toEqual(["training"]);
  });

  test("a refused approval is sent again on retry, and never writes the sign-off columns", async ({
    page,
  }) => {
    const refusal = { once: true };
    await page.route(
      (url) => url.pathname.includes("durchgang.approvePolicy"),
      async (route) => {
        if (refusal.once) {
          refusal.once = false;
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: "{}",
          });
        } else {
          await route.continue();
        }
      },
    );

    await page.goto(`/de/durchgang/2.4?s=${SIGNATURE_SCREEN}`);
    const version = page.locator("#dg-policyVersion");
    await expect(version).toBeVisible({ timeout: 30_000 });
    await version.fill("1.0");
    await page.locator("#dg-policyApprovalDate").fill("2026-10-01");
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await next.click();

    await expect(
      page.getByText("Das wurde nicht gespeichert.", { exact: false }),
    ).toBeVisible();
    expect((await walkPolicy(tenant.company_id))?.status).toBe("draft");

    await next.click();
    await expect
      .poll(async () => (await walkPolicy(tenant.company_id))?.status ?? null)
      .toBe("approved");
    expect(await walkPolicy(tenant.company_id)).toMatchObject({
      version: "1.0",
      effective_from: "2026-10-01",
      approved_by: null,
      approved_at: null,
      approver_role: null,
    });
  });

  test("a text changed after approval goes back to draft", async ({ page }) => {
    await page.goto(`/de/durchgang/2.4?s=${POLICY_SCREEN}`);
    const training = page.getByRole("button", { name: "Schulungen" });
    await expect(training).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });

    await training.click();
    await expect(
      page.getByText("Die geänderte Fassung braucht eine neue Unterschrift."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await walkPolicy(tenant.company_id))?.status ?? null)
      .toBe("draft");
    expect((await walkPolicy(tenant.company_id))?.effective_from).toBeNull();
  });
});
