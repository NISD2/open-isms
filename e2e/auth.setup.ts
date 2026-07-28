/**
 * Setup project: provision + authenticate, once per run.
 *
 * Runs after the webServer is up (compose + hermetic DB reset + migrate +
 * seed happen in e2e/start-server.sh). Provisioning is deliberately
 * minimal: the seed creates Dev GmbH and its admin with a verified email;
 * the harness adds only what login and the multi-user specs need — a
 * password hash, and a second management member for N-of-M sign-offs.
 */
import { test as setup, expect, type Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import {
  S3Client,
  CreateBucketCommand,
  BucketAlreadyOwnedByYou,
  BucketAlreadyExists,
} from "@aws-sdk/client-s3";
import {
  assertE2eTargets,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  E2E_MANAGER_EMAIL,
  E2E_STORAGE_STATE,
  E2E_STORAGE_STATE_MANAGER,
} from "./lib/env";
import { e2eQuery } from "./lib/db";

async function login(page: Page, email: string): Promise<void> {
  await page.goto("/de/auth/signin");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(E2E_USER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(journey|dashboard)/, { timeout: 30_000 });
}

setup("provision and authenticate", async ({ page, browser }) => {
  assertE2eTargets();

  // Evidence bucket for the MinIO stack (idempotent).
  const s3 = new S3Client({
    region: "eu-north-1",
    endpoint: "http://localhost:9000",
    forcePathStyle: true,
    credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin" },
  });
  try {
    await s3.send(new CreateBucketCommand({ Bucket: "e2e-evidence" }));
  } catch (err) {
    if (
      !(err instanceof BucketAlreadyOwnedByYou) &&
      !(err instanceof BucketAlreadyExists)
    ) {
      throw err;
    }
  }

  // Give the seeded admin a password so the real credentials form works.
  const hash = await bcrypt.hash(E2E_USER_PASSWORD, 10);
  const updated = await e2eQuery(
    `UPDATE "user" SET password_hash = $1 WHERE email = $2 RETURNING id`,
    [hash, E2E_USER_EMAIL],
  );
  if (updated.length !== 1) {
    throw new Error(
      `expected exactly 1 seeded user for ${E2E_USER_EMAIL}, got ${updated.length}. Did drizzle/seed.ts run?`,
    );
  }

  // Second user: management member in the same company, for N-of-M.
  await e2eQuery(
    `INSERT INTO "user" (company_id, email, name, role, is_management, email_verified_at, password_hash)
     SELECT company_id, $2, 'E2E Management', 'member', true, NOW(), $3
       FROM "user" WHERE email = $1
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           company_id = EXCLUDED.company_id,
           is_management = true`,
    [E2E_USER_EMAIL, E2E_MANAGER_EMAIL, hash],
  );

  // Log both users in through the real form; each keeps a session file.
  await login(page, E2E_USER_EMAIL);
  await expect(page.locator("body")).toBeVisible();
  await page.context().storageState({ path: E2E_STORAGE_STATE });

  const managerContext = await browser.newContext();
  const managerPage = await managerContext.newPage();
  await login(managerPage, E2E_MANAGER_EMAIL);
  await managerContext.storageState({ path: E2E_STORAGE_STATE_MANAGER });
  await managerContext.close();
});
