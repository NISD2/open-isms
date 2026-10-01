/**
 * L2 Durchgang staff training (8.2): one line per session in the training register, written
 * through the real UI against real Postgres, kept apart from the management lines 1.1 lists.
 *
 * Cleanup removes the line this file adds, because later layers read this tenant
 * (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { e2eTenant, payFor, type Tenant, type Undo, undoAll } from "../lib/durchgang";

// learn, example, trainings, done.
const TRAININGS_SCREEN = 2;
const TOPIC = "E2E Phishing erkennen";

interface TrainingRow {
  title: string;
  participant_name: string;
  is_management: boolean | null;
  training_type: string;
}

const linesOf = (tenant: Tenant) =>
  e2eQuery<TrainingRow>(
    `SELECT title, participant_name, is_management, training_type
       FROM training_record WHERE company_id = $1 AND title = $2`,
    [tenant.company_id, TOPIC],
  );

async function removeLines(tenant: Tenant): Promise<Undo> {
  return async () => {
    await e2eQuery(`DELETE FROM training_record WHERE company_id = $1 AND title = $2`, [
      tenant.company_id,
      TOPIC,
    ]);
  };
}

test.describe("durchgang staff training", () => {
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [await removeLines(tenant), await payFor(tenant)];
  });

  test.afterAll(() => undoAll(undos));

  test("records a staff session as an awareness line, apart from management's", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/8.2?s=${TRAININGS_SCREEN}`);
    const who = page.getByLabel("Wer teilgenommen hat");
    await expect(who).toBeVisible({ timeout: 30_000 });

    await who.fill("Alle Beschäftigten");
    await page.getByLabel("Thema").fill(TOPIC);
    await page.getByLabel("Datum").fill("2026-01-14");
    await page.getByRole("button", { name: "Hinzufügen" }).click();
    await expect(page.getByText(TOPIC)).toBeVisible();

    await expect.poll(async () => (await linesOf(tenant)).length).toBe(1);
    const [line] = await linesOf(tenant);
    expect(line).toMatchObject({
      participant_name: "Alle Beschäftigten",
      is_management: false,
      training_type: "awareness",
    });

    await page.goto("/de/durchgang/1.1?s=2");
    await expect(page.getByLabel("Name")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(TOPIC)).toHaveCount(0);
  });
});
