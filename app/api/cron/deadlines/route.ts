/**
 * Cron endpoint: the daily deadline run (lib/cron/deadlines.ts).
 *
 * The run is scheduled inside the app (lib/cron/deadlines-schedule.ts, started by
 * instrumentation.ts), so nisd2.eu needs no outside task. This endpoint stays for a manual run and
 * for self-hosters who prefer an outside cron. It goes through the same deadlinesOnce, so it never
 * runs a second time on a day the schedule already ran, and answers "skipped" with the reason.
 *
 * Security: Bearer token from CRON_SECRET env var.
 */

import { type NextRequest, NextResponse } from "next/server";
import { verifyCronBearer } from "@/lib/cron/auth";
import { deadlinesOnce } from "@/lib/cron/deadlines-schedule";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  // Audit EW-3 (2026-06-11): constant-time bearer comparison via
  // verifyCronBearer. Removes the per-byte timing side channel on the
  // previous string compare.
  if (!verifyCronBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const outcome = await deadlinesOnce("manual");
  switch (outcome.kind) {
    case "ran":
      return NextResponse.json({
        ok: true,
        elapsed: outcome.elapsed,
        stats: outcome.stats,
      });
    case "skipped":
      return NextResponse.json({ ok: true, skipped: outcome.reason });
    case "failed":
      // Don't echo internal error details to the response — even though the
      // endpoint is CRON_SECRET-gated, leaking schema/connection-string snippets
      // is unnecessary risk. Full message stays in the audit log.
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
