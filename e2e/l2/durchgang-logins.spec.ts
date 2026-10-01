/**
 * L2 Durchgang sign-ins (11.1): per program and remote access on the list, whether signing in
 * takes a second factor, through the real UI against real Postgres.
 *
 * The screen asks every software and network asset on the list, so the spec answers all of them.
 * Cleanup removes the asset this file adds and puts every other asset's mark back as it was,
 * because later layers read this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { e2eTenant, payFor, type Tenant, type Undo, undoAll } from "../lib/durchgang";

// learn, where first, sign-ins, tool, done.
const LOGINS_SCREEN = 2;
const NAME = "E2E Fernzugang";

interface Mark {
  id: string;
  has_mfa: boolean | null;
}

const marksOf = (tenant: Tenant) =>
  e2eQuery<Mark>(`SELECT id, has_mfa FROM asset WHERE company_id = $1`, [
    tenant.company_id,
  ]);

/** Puts every asset's mark back, and removes the asset this file adds. */
async function keepMarks(tenant: Tenant): Promise<Undo> {
  const before = await marksOf(tenant);
  return async () => {
    await e2eQuery(`DELETE FROM asset WHERE company_id = $1 AND name = $2`, [
      tenant.company_id,
      NAME,
    ]);
    for (const row of before) {
      await e2eQuery(`UPDATE asset SET has_mfa = $2 WHERE id = $1`, [
        row.id,
        row.has_mfa,
      ]);
    }
  };
}

test.describe("durchgang sign-ins", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [await keepMarks(tenant), await payFor(tenant)];
    await e2eQuery(
      `INSERT INTO asset (company_id, name, type, has_mfa) VALUES ($1, $2, 'network', false)`,
      [tenant.company_id, NAME],
    );
  });

  test.afterAll(() => undoAll(undos));

  test("marks per sign-in whether a second factor is on, and names each one in the trail", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/11.1?s=${LOGINS_SCREEN}`);
    const ours = page.getByRole("listitem").filter({ hasText: NAME });
    await expect(ours).toBeVisible({ timeout: 30_000 });
    await expect(ours.getByText("Nicht bewertet")).toBeVisible();

    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await expect(next).toBeDisabled();
    for (const password of await page
      .getByRole("button", { name: "Nur Passwort" })
      .all()) {
      await password.click();
    }
    await ours.getByRole("button", { name: "Mit zweitem Faktor" }).click();
    await expect(ours.getByRole("button", { name: "Nur Passwort" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await next.click();

    await expect
      .poll(async () => {
        const [row] = await e2eQuery<Mark>(
          `SELECT id, has_mfa FROM asset WHERE company_id = $1 AND name = $2`,
          [tenant.company_id, NAME],
        );
        return row?.has_mfa ?? null;
      })
      .toBe(true);

    const [status] = await e2eQuery<{ internal_notes: string | null }>(
      `SELECT s.internal_notes
         FROM company_requirement_status s
         JOIN company_assessment a ON a.id = s.assessment_id
         JOIN requirement r ON r.id = s.requirement_id
        WHERE a.company_id = $1 AND r.code = '11.1'`,
      [tenant.company_id],
    );
    expect(status?.internal_notes).toContain(`${NAME}: mit zweitem Faktor`);
  });
});
