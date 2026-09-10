import { exec } from "node:child_process";
import { NextResponse } from "next/server";

/**
 * POST /api/dev/seed — re-run the database seed script.
 *
 * Hardened:
 *   - Answers 404 unless NODE_ENV is exactly "development". Audit F-10
 *     (2026-09-10) inverted the old `=== "production"` test, which failed
 *     open for every value that is neither: an unset NODE_ENV, "test",
 *     "staging", a typo. Allow-listing the one environment that should reach
 *     the exec fails closed instead.
 *
 *     Be precise about what this is: a runtime env read hoisted to module
 *     scope, which a bundler MAY fold away but is not guaranteed to. The
 *     route file still ships. It is the same shape as the tRPC dev-router
 *     exclusion in server/trpc/router.ts, which is also a runtime read.
 *     Treat both as hardened runtime checks, not as absence.
 *   - drizzle/seed.ts also throws at module load in production, and the
 *     runner image bakes NODE_ENV=production (Dockerfile), so the guard is
 *     three-deep in anything actually shipped.
 *   - Does NOT echo stdout/stderr back to the caller. The seed script logs
 *     row counts and table names that would be useful to an attacker probing
 *     this surface; failures should be diagnosed from server logs only.
 *   - Fixed shell command with no input interpolation — no injection vector.
 */
const isDev = process.env.NODE_ENV === "development";

export async function POST() {
  if (!isDev) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      exec(
        "bun run drizzle/seed.ts",
        { cwd: process.cwd(), timeout: 60_000 },
        (error) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Generic error — do not leak stderr or error.message to the client.
    return NextResponse.json(
      { ok: false, error: "Seed failed. Check server logs." },
      { status: 500 },
    );
  }
}
