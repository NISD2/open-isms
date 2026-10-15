/**
 * L2 open points at the approval (7.3): each point the company's own answers leave open takes a
 * responsible person and a due day, through the real UI against real Postgres. The plan is one
 * line on the improvement register, it survives a reload, and the action items page lists it.
 *
 * A step set aside gives the tenant an open point whatever earlier specs left, and a step filled
 * in gives the approval something to show. Cleanup removes the line and both events and puts the
 * sign-offs back, because later layers read this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  e2eUserId,
  fillWalkItem,
  keepSignOffs,
  payFor,
  setAsideWalkItem,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";

// learn, inputs, risk map, example, review, approve, done.
const APPROVE_SCREEN = 5;
/** A step filled in and waiting for management, so the approval has something to list. */
const FILLED = "12.2";
/** The step set aside, which the approval lists as an open point. */
const ASIDE = "11.2";
const ASIDE_HEADLINE = "Gesicherte Kommunikation festhalten";
/** A due day from today on, as the field takes it. */
const DUE = `${new Date().getFullYear() + 1}-12-31`;

async function removeMeasures(tenant: Tenant): Promise<Undo> {
  const remove = () =>
    e2eQuery(
      `DELETE FROM improvement_item WHERE company_id = $1 AND source = 'gap_analysis'`,
      [tenant.company_id],
    ).then(() => undefined);
  await remove();
  return remove;
}

test.describe("durchgang open points", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await payFor(tenant),
      await keepSignOffs(tenant),
      // After keepSignOffs, so its snapshot holds both steps as they were.
      await fillWalkItem(tenant, FILLED),
      await setAsideWalkItem(tenant, ASIDE),
      await removeMeasures(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("an open point takes who and by when, kept as a line on the action items list", async ({
    page,
  }) => {
    const userId = await e2eUserId();
    await page.goto(`/de/durchgang/nis2/7.3?s=${APPROVE_SCREEN}`);
    const point = page
      .getByRole("listitem")
      .filter({ hasText: `Noch zur Seite gelegt: ${ASIDE_HEADLINE}` });
    await expect(point).toBeVisible({ timeout: 30_000 });
    await expect(point.getByLabel("Zuständig")).toHaveValue("");

    await point.getByLabel("Zuständig").selectOption(userId);
    await point.getByLabel("Erledigt bis").fill(DUE);

    await expect
      .poll(async () =>
        e2eQuery<{
          assigned_to: string | null;
          target_date: string | null;
          status: string;
        }>(
          `SELECT i.assigned_to, i.target_date::text, i.status
             FROM improvement_item i JOIN requirement r ON r.id = i.source_reference_id
            WHERE i.company_id = $1 AND i.source = 'gap_analysis' AND r.code = $2`,
          [tenant.company_id, ASIDE],
        ),
      )
      .toEqual([{ assigned_to: userId, target_date: DUE, status: "open" }]);

    await page.reload();
    await expect(point.getByLabel("Zuständig")).toHaveValue(userId, { timeout: 30_000 });
    await expect(point.getByLabel("Erledigt bis")).toHaveValue(DUE);

    await page.goto("/de/improvements");
    await expect(page.getByText(`${ASIDE} ${ASIDE_HEADLINE}`)).toBeVisible({
      timeout: 30_000,
    });
  });
});
