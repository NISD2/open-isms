/**
 * The app router imports these modules, so loading them must not need a secret: the Docker image
 * build runs `next build` with no AUTH_SECRET, and a module that derives a key when it loads fails
 * the build of /api/mcp, which the ordinary build (with its environment) never shows.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "../..");

const importInFreshProcess = async (file: string) => {
  const child = Bun.spawn(
    [
      process.execPath,
      "--no-env-file",
      "-e",
      `await import(${JSON.stringify(join(root, file))})`,
    ],
    {
      cwd: root,
      // No AUTH_SECRET and no .env: only what a build without secrets has.
      env: {
        PATH: process.env.PATH ?? "",
        SKIP_ENV_VALIDATION: "1",
        DATABASE_URL: "postgres://build:build@localhost:5432/build",
      },
      stderr: "pipe",
      stdout: "pipe",
    },
  );
  const [code, stderr] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
  ]);
  return { code, stderr };
};

describe("loading the endpoint's modules without a secret", () => {
  for (const file of [
    "lib/test-mcp/context.ts",
    "lib/test-mcp/server.ts",
    "server/trpc/routers/platform-admin-users.ts",
  ]) {
    test(`${file} imports with no AUTH_SECRET`, async () => {
      const { code, stderr } = await importInFreshProcess(file);
      expect({ code, stderr: code === 0 ? "" : stderr.slice(-400) }).toEqual({
        code: 0,
        stderr: "",
      });
    }, 30_000);
  }
});
