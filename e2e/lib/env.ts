/**
 * E2E harness environment. The harness NEVER reads the app's DATABASE_URL;
 * it owns E2E_DATABASE_URL / E2E_BASE_URL and injects everything the
 * app-under-test needs (see e2e/start-server.sh).
 *
 * All values are non-secret localhost dummies, committed on purpose.
 * assertE2eTargets() is the never-on-prod guard: destructive helpers refuse
 * to touch anything that is not a localhost database whose name ends in
 * `_e2e`. See the plan (private repo, product-design/e2e/) for why this is
 * a connection-shaped guard and not a boolean env var.
 */

export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgres://e2e:e2e@localhost:5434/openisms_e2e";

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3026";

/** Seeded by drizzle/seed.ts (Dev GmbH admin). The harness only adds the
 *  password hash — see e2e/auth.setup.ts. */
export const E2E_USER_EMAIL = "dev@nis2.local";
export const E2E_USER_PASSWORD = "e2e-Passw0rd-local-only";

/** Second user (management member), provisioned by auth.setup for the
 *  N-of-M sign-off specs. Same password as the admin. */
export const E2E_MANAGER_EMAIL = "e2e-management@nis2.local";

export const E2E_STORAGE_STATE = "e2e/.auth/admin.json";
export const E2E_STORAGE_STATE_MANAGER = "e2e/.auth/manager.json";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function assertE2eTargets(): void {
  const db = new URL(E2E_DATABASE_URL);
  const dbName = db.pathname.replace(/^\//, "");
  if (!LOCAL_HOSTS.has(db.hostname)) {
    throw new Error(
      `e2e guard: E2E_DATABASE_URL host "${db.hostname}" is not localhost. Refusing.`,
    );
  }
  if (!dbName.endsWith("_e2e")) {
    throw new Error(
      `e2e guard: E2E_DATABASE_URL database "${dbName}" does not end in "_e2e". Refusing.`,
    );
  }
  const base = new URL(E2E_BASE_URL);
  if (!LOCAL_HOSTS.has(base.hostname)) {
    throw new Error(
      `e2e guard: E2E_BASE_URL host "${base.hostname}" is not localhost. Refusing.`,
    );
  }
}
