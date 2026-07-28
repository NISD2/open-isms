/**
 * Setup project: provision + authenticate, once per run.
 *
 * Runs after the webServer is up (compose + migrate + seed happen in
 * e2e/start-server.sh). Provisioning is deliberately minimal: the seed
 * already creates the Dev GmbH company and its admin user with a verified
 * email; the only thing missing for credentials login is a password hash.
 */
import { test as setup, expect } from "@playwright/test";
import { Client } from "pg";
import bcrypt from "bcryptjs";
import {
  S3Client,
  CreateBucketCommand,
  BucketAlreadyOwnedByYou,
  BucketAlreadyExists,
} from "@aws-sdk/client-s3";
import {
  assertE2eTargets,
  E2E_DATABASE_URL,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  E2E_STORAGE_STATE,
} from "./lib/env";

setup("provision and authenticate", async ({ page }) => {
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
  const pg = new Client({ connectionString: E2E_DATABASE_URL });
  await pg.connect();
  try {
    const hash = await bcrypt.hash(E2E_USER_PASSWORD, 10);
    const res = await pg.query(
      `UPDATE "user" SET password_hash = $1 WHERE email = $2`,
      [hash, E2E_USER_EMAIL],
    );
    if (res.rowCount !== 1) {
      throw new Error(
        `expected exactly 1 seeded user for ${E2E_USER_EMAIL}, got ${res.rowCount}. Did drizzle/seed.ts run?`,
      );
    }
  } finally {
    await pg.end();
  }

  // Log in through the real form and keep the session for all specs.
  await page.goto("/de/auth/signin");
  await page.locator("#email").fill(E2E_USER_EMAIL);
  await page.locator("#password").fill(E2E_USER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(journey|dashboard)/, { timeout: 30_000 });
  await expect(page.locator("body")).toBeVisible();

  await page.context().storageState({ path: E2E_STORAGE_STATE });
});
