/**
 * Cron Job: Close CRM sync, manual trigger
 *
 * The sync runs by itself inside the app every 30 minutes when CLOSE_API_KEY is
 * set (lib/crm/schedule.ts, started from instrumentation.ts), so nothing needs
 * to call this on a schedule. It exists to run one sync now and read its result.
 * Runs share an advisory lock, so a call during a scheduled run is skipped.
 *
 * Without CLOSE_API_KEY the run reports `skipped` and sends nothing, which is
 * every self-hosted instance that has not chosen Close.
 *
 * Security: Bearer token from CRON_SECRET env var.
 */
import { type NextRequest, NextResponse } from "next/server";
import { closeSyncFailed, closeSyncOnce } from "@/lib/crm/schedule";
import { verifyCronBearer } from "@/lib/cron/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (!verifyCronBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const outcome = await closeSyncOnce("manual");
  if (!outcome.ok) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  // A run that stopped early or had an erasure refused answers 500, so `curl -f` goes red.
  const failed = closeSyncFailed(outcome.result);
  return NextResponse.json(
    { ok: !failed, elapsed: outcome.elapsed, ...outcome.result },
    { status: failed ? 500 : 200 },
  );
}
