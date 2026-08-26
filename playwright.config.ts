import { defineConfig, devices } from "@playwright/test";

const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3410";

export default defineConfig({
  testDir: "./e2e",
  // e2e/l0 are bun:test unit tests (run via `bun test e2e/l0`), not
  // browser specs — Playwright's default testMatch would otherwise load
  // them and crash on the bun:test import.
  testIgnore: "**/l0/**",
  outputDir: "./test-results",
  fullyParallel: false,
  // One shared tenant, deliberate cross-file order: l1 intake saves flip
  // seeded-complete requirements back to signable before l3 signs them.
  // Parallel workers break that order (and race router.refresh on the
  // same company), so the suite is serial by design.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    locale: "de-DE",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "bash e2e/start-server.sh",
    url: E2E_BASE_URL,
    // First run builds the production bundle inside the command.
    timeout: 900_000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
});
