import { NextResponse } from "next/server";
import { exec } from "child_process";

/**
 * POST /api/dev/seed — re-run the database seed script.
 *
 * Hardened:
 *   - Build-time gate: outside a development build the handler answers 404
 *     and never reaches the exec. Audit F-10 (2026-09-10) — this used to be
 *     a runtime `NODE_ENV === "production"` check, which is one typo in a
 *     deployment config away from being live. The tRPC dev router next door
 *     is excluded from the bundle the same way (server/trpc/router.ts).
 *   - drizzle/seed.ts also throws at module load in production, so the guard
 *     is two-deep.
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
