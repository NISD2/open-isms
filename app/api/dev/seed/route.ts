import { NextResponse } from "next/server";
import { exec } from "child_process";

/**
 * POST /api/dev/seed — re-run the database seed script.
 *
 * Hardened:
 *   - Runtime NODE_ENV gate (defense in depth — drizzle/seed.ts also throws
 *     at module load in production).
 *   - Does NOT echo stdout/stderr back to the caller. The seed script logs
 *     row counts and table names that would be useful to an attacker probing
 *     this surface; failures should be diagnosed from server logs only.
 *   - Fixed shell command with no input interpolation — no injection vector.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
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
