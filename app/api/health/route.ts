import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      // Stamped into the image at release. A self-hoster watching an update
      // land has no other way to tell which version answered: the browser
      // loses its server mid-swap, and this is what it polls until the
      // version changes. `dev` means the image was not built by the release
      // pipeline.
      version: process.env.APP_VERSION ?? "dev",
      composeRevision: process.env.COMPOSE_REVISION ?? null,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
