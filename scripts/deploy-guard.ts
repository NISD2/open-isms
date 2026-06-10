/**
 * Deploy-time guard for the "no night deploys" rule.
 *
 * Founder instruction (2026-05-29): never deploy at night. Production
 * builds for the docs content sweep run only during the working window
 * so a human is available to roll back if something breaks. Coolify
 * auto-deploys on push to `main`, so this script is intended to be
 * called from a CI/local pre-push hook OR from a `bun run build` script
 * wrapper before content batches are pushed.
 *
 * Window: 08:00 – 18:00 CET, Monday – Friday.
 * Override: set OVERRIDE_NIGHT_DEPLOY=1 to bypass (use sparingly).
 *
 * Usage:
 *   bun run scripts/deploy-guard.ts                # exits non-zero if outside window
 *   OVERRIDE_NIGHT_DEPLOY=1 bun run scripts/deploy-guard.ts   # bypass
 *
 * Defined here: 2026-05-29 alongside docs-architecture-2026-05-29.md.
 */

const WINDOW_START_HOUR_CET = 8;
const WINDOW_END_HOUR_CET = 18;
const ALLOWED_DAYS_0_SUN_6_SAT = new Set([1, 2, 3, 4, 5]); // Mon-Fri

function getCetHourAndDay(now: Date): { hour: number; day: number } {
  // Use Intl to get the CET wall clock. Handles DST correctly.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === "hour")?.value;
  const weekdayPart = parts.find((p) => p.type === "weekday")?.value;
  if (!hourPart || !weekdayPart) {
    throw new Error("[deploy-guard] Failed to read CET time components");
  }
  const hour = parseInt(hourPart, 10);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = dayMap[weekdayPart] ?? -1;
  return { hour, day };
}

export interface GuardResult {
  allowed: boolean;
  reason: string;
}

export function checkDeployWindow(now: Date = new Date()): GuardResult {
  if (process.env.OVERRIDE_NIGHT_DEPLOY === "1") {
    return {
      allowed: true,
      reason: "OVERRIDE_NIGHT_DEPLOY=1 set — bypassing window check.",
    };
  }
  const { hour, day } = getCetHourAndDay(now);
  if (!ALLOWED_DAYS_0_SUN_6_SAT.has(day)) {
    return {
      allowed: false,
      reason: `Deploy blocked: weekend (CET weekday=${day}). Allowed: Mon-Fri.`,
    };
  }
  if (hour < WINDOW_START_HOUR_CET || hour >= WINDOW_END_HOUR_CET) {
    return {
      allowed: false,
      reason: `Deploy blocked: outside working hours (CET ${hour}:00). Allowed: ${WINDOW_START_HOUR_CET}:00-${WINDOW_END_HOUR_CET}:00.`,
    };
  }
  return {
    allowed: true,
    reason: `Within deploy window (CET ${hour}:00 weekday=${day}).`,
  };
}

// CLI entry — exit non-zero if outside window so CI / git hook can block.
if (import.meta.main) {
  const result = checkDeployWindow();
  console.log(`[deploy-guard] ${result.reason}`);
  if (!result.allowed) {
    console.error(
      "[deploy-guard] To override (use sparingly): OVERRIDE_NIGHT_DEPLOY=1",
    );
    process.exit(1);
  }
  process.exit(0);
}
