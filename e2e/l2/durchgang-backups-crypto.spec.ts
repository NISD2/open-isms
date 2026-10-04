/**
 * L2 Durchgang backup systems (4.4) and crypto list (9.1), through the real UI against real
 * Postgres: each backup system on the list gets how often it backs up and its last restore that
 * worked, in the asset's own columns; the BSI TR-02102 list is shown until the company keeps one,
 * and ticking that it applies takes it over.
 *
 * Cleanup removes the backup system this file adds and puts the crypto list back as it was,
 * because later layers read this tenant (`e2e/lib/durchgang.ts`).
 */
import { expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  enabledNext,
  payFor,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";

// 4.4: learn, example, what to ask first, then the backup systems.
const SYSTEMS_SCREEN = 3;
// 9.1: learn, then the crypto list.
const LIST_SCREEN = 1;
const SYSTEM = "E2E Sicherung Veeam";
// 2.2 keeps the catalogue name in the description, which is how 4.4 knows a backup system.
const KIND = "Backup-System (Veeam, NAS, Cloud-Backup)";

async function seedBackupSystem(tenant: Tenant): Promise<Undo> {
  await e2eQuery(
    `INSERT INTO asset (company_id, name, type, description) VALUES ($1, $2, 'data_store', $3)`,
    [tenant.company_id, SYSTEM, KIND],
  );
  return async () => {
    await e2eQuery(`DELETE FROM asset WHERE company_id = $1 AND name = $2`, [
      tenant.company_id,
      SYSTEM,
    ]);
  };
}

/** Takes the crypto list away for the file, so the BSI's shows, and puts it back after. */
async function withoutCryptoList(tenant: Tenant): Promise<Undo> {
  const [kept] = await e2eQuery<{ config: unknown }>(
    `SELECT config FROM company_policy_config WHERE company_id = $1 AND policy_type = 'crypto'`,
    [tenant.company_id],
  );
  await e2eQuery(
    `DELETE FROM company_policy_config WHERE company_id = $1 AND policy_type = 'crypto'`,
    [tenant.company_id],
  );
  return async () => {
    await e2eQuery(
      `DELETE FROM company_policy_config WHERE company_id = $1 AND policy_type = 'crypto'`,
      [tenant.company_id],
    );
    if (kept) {
      await e2eQuery(
        `INSERT INTO company_policy_config (company_id, policy_type, config) VALUES ($1, 'crypto', $2)`,
        [tenant.company_id, JSON.stringify(kept.config)],
      );
    }
  };
}

test.describe("durchgang backup systems and crypto list", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await seedBackupSystem(tenant),
      await withoutCryptoList(tenant),
      await payFor(tenant),
    ];
  });

  test.afterAll(() => undoAll(undos));

  test("records how often a backup system backs up and its last restore (4.4)", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/nis2/4.4?s=${SYSTEMS_SCREEN}`);
    const row = page.getByRole("listitem").filter({ hasText: SYSTEM });
    await expect(row).toBeVisible({ timeout: 30_000 });

    await row.getByRole("button", { name: "täglich", exact: true }).click();
    await row.getByLabel("Letzte geglückte Wiederherstellung daraus").fill("2026-09-30");
    await page.getByRole("button", { name: "Weiter", exact: true }).click();

    await expect
      .poll(async () => {
        const [stored] = await e2eQuery<{
          backup_frequency: string | null;
          last_backup_test_date: string | null;
        }>(
          `SELECT backup_frequency, last_backup_test_date::text AS last_backup_test_date
             FROM asset WHERE company_id = $1 AND name = $2`,
          [tenant.company_id, SYSTEM],
        );
        return stored ?? null;
      })
      .toEqual({ backup_frequency: "daily", last_backup_test_date: "2026-09-30" });
  });

  test("shows the BSI list and takes it over once the company says it applies (9.1)", async ({
    page,
  }) => {
    await page.goto(`/de/durchgang/nis2/9.1?s=${LIST_SCREEN}`);
    await expect(page.getByText("BSI TR-02102, Version 2026-01")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("AES-256-GCM (256)", { exact: false })).toBeVisible();
    const next = page.getByRole("button", { name: "Weiter", exact: true });
    await expect(enabledNext(page)).toHaveCount(0);

    await page.locator("#dg-crypto-applies").click();
    await next.click();

    await expect
      .poll(async () => {
        const [stored] = await e2eQuery<{ approved: number }>(
          `SELECT jsonb_array_length(config->'algorithms') AS approved
             FROM company_policy_config WHERE company_id = $1 AND policy_type = 'crypto'`,
          [tenant.company_id],
        );
        return (stored?.approved ?? 0) > 0;
      })
      .toBe(true);
  });
});
