/**
 * L2 Durchgang concepts: each Konzept the walk writes without a signature screen (9.1, 10.1, 6.3,
 * 4.2) is written from its template with a chosen clause, as a draft of its requirement, through
 * the real UI against real Postgres. A requirement page's editor for the same measure keeps its
 * settings in the same table under its own type, so this file also proves the walk leaves them as
 * they were.
 *
 * Cleanup removes the policies and clause choices this file wrote, and the editor settings it
 * seeded, because later layers sign off against this tenant (`e2e/lib/durchgang.ts`).
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

/**
 * One Konzept: where its policy screen is, the editors whose settings sit beside it, the clause the
 * test adds, and what it then reads.
 */
const CONCEPTS = [
  {
    code: "9.1",
    screen: 1,
    type: "cryptography",
    editors: ["crypto"],
    title: "Kryptokonzept der",
    clause: "Laptops",
    added: "6. Laptops",
  },
  {
    code: "10.1",
    screen: 2,
    type: "personnel_access",
    editors: ["access_control"],
    title: "Konzept für Personal, Zugänge und IT der",
    clause: "Vertretung",
    added: "8. Vertretung",
  },
  {
    // The rules absorb 6.1, 6.2 and 6.4, each with its own editor.
    code: "6.3",
    screen: 4,
    type: "it_rules",
    editors: ["procurement", "secure_dev", "patch_mgmt"],
    title: "Regeln für Kauf, Wartung und Schwachstellen der IT der",
    clause: "Fernwartung",
    added: "7. Fernwartung",
  },
  {
    code: "4.2",
    screen: 4,
    type: "business_continuity",
    editors: [],
    title: "Notfallplan für den Betrieb der",
    clause: "Gedruckte Fassung",
    added: "9. Gedruckte Fassung",
  },
] as const;

const editorConfig = async (tenant: Tenant, editorType: string) => {
  const [row] = await e2eQuery<{ config: unknown }>(
    `SELECT config FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
    [tenant.company_id, editorType],
  );
  return row?.config ?? null;
};

const editorConfigs = (tenant: Tenant, editors: readonly string[]) =>
  Promise.all(editors.map((editor) => editorConfig(tenant, editor)));

/** Gives the tenant editor settings to protect, unless it has some already. */
async function seedEditorConfig(tenant: Tenant, editorType: string): Promise<Undo> {
  if ((await editorConfig(tenant, editorType)) !== null) return async () => {};
  await e2eQuery(
    `INSERT INTO company_policy_config (company_id, policy_type, config) VALUES ($1, $2, $3)`,
    [tenant.company_id, editorType, JSON.stringify({ seededBy: "durchgang-concepts" })],
  );
  return async () => {
    await e2eQuery(
      `DELETE FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
      [tenant.company_id, editorType],
    );
  };
}

test.describe("durchgang concepts", () => {
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    const kept: Undo[] = [];
    for (const concept of CONCEPTS) {
      kept.push(await keepPolicies(tenant, concept.type));
      for (const editor of concept.editors) {
        kept.push(await seedEditorConfig(tenant, editor));
      }
    }
    undos = [...kept, await payFor(tenant)];
  });

  test.afterAll(() => undoAll(undos));

  for (const concept of CONCEPTS) {
    test(`writes the ${concept.code} Konzept as a draft, and leaves the editors' settings alone`, async ({
      page,
    }) => {
      const before = await editorConfigs(tenant, concept.editors);
      await page.goto(`/de/durchgang/${concept.code}?s=${concept.screen}`);
      const clause = page.getByRole("button", { name: concept.clause, exact: true });
      await expect(clause).toBeVisible({ timeout: 30_000 });

      await clause.click();
      await expect(page.getByText(concept.added)).toBeVisible();
      await page.getByRole("button", { name: "Weiter", exact: true }).click();

      await expect
        .poll(async () => (await walkPolicy(tenant, concept.type))?.content ?? "")
        .toContain(`## ${concept.added}`);
      const policy = await walkPolicy(tenant, concept.type);
      expect(policy?.title).toBe(`${concept.title} ${tenant.company_name}`);
      expect(policy?.status).toBe("draft");

      const [owner] = await e2eQuery<{ code: string }>(
        `SELECT r.code FROM policy p JOIN requirement r ON r.id = p.requirement_id
          WHERE p.company_id = $1 AND p.type = $2`,
        [tenant.company_id, concept.type],
      );
      expect(owner?.code).toBe(concept.code);
      expect(await editorConfigs(tenant, concept.editors)).toEqual(before);
    });
  }
});
