/**
 * L2 Durchgang Kryptokonzept (9.1): the walk writes the company's Kryptokonzept from the template
 * with a chosen clause, as a draft of requirement 9.1, through the real UI against real Postgres.
 * The requirement page's crypto editor keeps its settings in the same table under its own type,
 * so this file also proves the walk leaves them as they were.
 *
 * Cleanup removes the policy and the clause choice this file wrote, and the editor settings if it
 * seeded them, because later layers sign off against this tenant (`e2e/lib/durchgang.ts`).
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

// learn, Kryptokonzept, done.
const POLICY_SCREEN = 1;
const TYPE = "cryptography";
const EDITOR_TYPE = "crypto";

const editorConfig = async (tenant: Tenant) => {
  const [row] = await e2eQuery<{ config: unknown }>(
    `SELECT config FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
    [tenant.company_id, EDITOR_TYPE],
  );
  return row?.config ?? null;
};

/** Gives the tenant editor settings to protect, unless it has some already. */
async function seedEditorConfig(tenant: Tenant): Promise<Undo> {
  if ((await editorConfig(tenant)) !== null) return async () => {};
  await e2eQuery(
    `INSERT INTO company_policy_config (company_id, policy_type, config) VALUES ($1, $2, $3)`,
    [
      tenant.company_id,
      EDITOR_TYPE,
      JSON.stringify({ minTlsVersion: "tls_1_2", reviewCycleYears: 1 }),
    ],
  );
  return async () => {
    await e2eQuery(
      `DELETE FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
      [tenant.company_id, EDITOR_TYPE],
    );
  };
}

test.describe("durchgang kryptokonzept", () => {
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await keepPolicies(tenant, TYPE),
      await seedEditorConfig(tenant),
      await payFor(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("writes the Kryptokonzept of 9.1 as a draft, and leaves the editor's settings alone", async ({
    page,
  }) => {
    const before = await editorConfig(tenant);
    await page.goto(`/de/durchgang/9.1?s=${POLICY_SCREEN}`);
    const laptops = page.getByRole("button", { name: "Laptops" });
    await expect(laptops).toBeVisible({ timeout: 30_000 });

    await laptops.click();
    await expect(page.getByText("6. Laptops")).toBeVisible();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => (await walkPolicy(tenant, TYPE))?.content ?? "")
      .toContain("## 6. Laptops");
    const policy = await walkPolicy(tenant, TYPE);
    expect(policy?.title).toBe(`Kryptokonzept der ${tenant.company_name}`);
    expect(policy?.status).toBe("draft");
    expect(policy?.content).not.toContain("## 7.");

    const [owner] = await e2eQuery<{ code: string }>(
      `SELECT r.code FROM policy p JOIN requirement r ON r.id = p.requirement_id
        WHERE p.company_id = $1 AND p.type = $2`,
      [tenant.company_id, TYPE],
    );
    expect(owner?.code).toBe("9.1");
    expect(await editorConfig(tenant)).toEqual(before);
  });
});
