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
import { parseRolloutParams } from "@/lib/lifecycle/rollout-params";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (!verifyCronBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Manual rollout controls, honored only behind the bearer check above:
  //   ?dryRun=1  — select and render, send nothing, claim nothing; the
  //                response lists who WOULD get what (canary step)
  //   ?limit=N   — cap the first real runs (1, then 5, then 25...); can only
  //                lower the built-in per-run cap, never raise it
  //
  // Both parse strictly and REJECT anything they do not recognise, rather
  // than falling back to the default. The default here is "send to everyone
  // due, up to 100", and these sends are irreversible: a mistyped safety flag
  // (?dryrun=1, a bare ?dryRun, ?limit=one) must never quietly mean "safety
  // off". Unparseable input is an operator error worth a 400, not a campaign.
  const parsed = parseRolloutParams(req.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { dryRun, maxPerType } = parsed;

  const startTime = Date.now();
  try {
    const result = await runLifecycleEmails(db, { dryRun, maxPerType });
    const elapsed = Date.now() - startTime;

    // A type whose prepare() threw is a dead campaign, not a partial success:
    // report it as a 500 so `curl -f` monitoring goes red instead of green
    // forever. Individual send failures stay 200 — they are per-recipient,
    // audited (email.lifecycle_failed), and visible in the stats.
    const brokenTypes =
      result.skipped === undefined
        ? Object.entries(result.types).filter(([, stats]) => stats.error)
        : [];
    if (brokenTypes.length > 0) {
      logAudit({
        companyId: null,
        userId: null,
        action: "cron.lifecycle.error",
        entityType: "system",
        entityId: null,
        description: `Lifecycle cron: ${brokenTypes.length} type(s) failed to run in ${elapsed}ms: ${JSON.stringify(result)}`,
      });
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    logAudit({
      companyId: null,
      userId: null,
      action: "cron.lifecycle",
      entityType: "system",
      entityId: null,
      // wouldSend (dry runs) is a recipient address list — it belongs in the
      // operator's response, not in an audit row.
      description: `Lifecycle cron ${dryRun ? "[dry run] " : ""}completed in ${elapsed}ms: ${JSON.stringify(result, (key, value) => (key === "wouldSend" ? undefined : value))}`,
    });
    return NextResponse.json({ ok: true, dryRun, elapsed, ...result });
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
