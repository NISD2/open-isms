/**
 * Cron Job: Lifecycle emails
 *
 * Daily cron that runs every registered lifecycle email type
 * (lib/lifecycle/registry.ts) — one-shot re-engagement emails like the
 * activation nudge. Each (user, type) pair is delivered AT MOST ONCE, ever,
 * enforced by the uq_notification_lifecycle_once unique index, so the
 * endpoint is safe to call as often as you like.
 *
 * When the email transport is unavailable (self-host without
 * RESEND_API_KEY, DISABLE_EMAIL, dev block) the run reports `skipped` and
 * claims nothing, so nobody's one shot is burned on an email that never
 * left the box.
 *
 * Security: Bearer token from CRON_SECRET env var.
 * Schedule: external cron (Coolify scheduled task) at 08:00 UTC — see
 * content/docs/self-hosting/scheduled-jobs.md.
 */
import { type NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { verifyCronBearer } from "@/lib/cron/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { runLifecycleEmails } from "@/lib/lifecycle/dispatch";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (!verifyCronBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  try {
    const result = await runLifecycleEmails(db);
    const elapsed = Date.now() - startTime;

    logAudit({
      companyId: null,
      userId: null,
      action: "cron.lifecycle",
      entityType: "system",
      entityId: null,
      description: `Lifecycle cron completed in ${elapsed}ms: ${JSON.stringify(result)}`,
    });
    return NextResponse.json({ ok: true, elapsed, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logAudit({
      companyId: null,
      userId: null,
      action: "cron.lifecycle.error",
      entityType: "system",
      entityId: null,
      description: `Lifecycle cron failed: ${message}`,
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
