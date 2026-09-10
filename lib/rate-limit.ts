/**
 * In-memory sliding-window rate limiter.
 *
 * Audit M-2 (2026-06-10) / F-2 (2026-09-10): the previous version pruned the
 * timestamps inside an entry but never removed the entry itself, so every
 * distinct key was a permanent Map entry for the life of the process. Keys
 * embed the client IP (`applicability:search:${ip}`, `supplier-access:read:${ip}`,
 * …), so the Map grew with every new caller and never shrank.
 *
 * Two changes, both of which only ever DELETE windows that have fully expired:
 * an entry whose timestamps have all aged out is indistinguishable from one
 * that was never created, so dropping it cannot hand anyone a fresh budget
 * they did not already have.
 *
 * Still per-process, so a redeploy resets every budget and a second replica
 * would double every limit. Moving the window to Postgres with a `reset_at`
 * TTL — the shape `email_otp` already uses — is the real fix and wants its
 * own change.
 */

interface Window {
  timestamps: number[];
  /** When the last timestamp in this window ages out. */
  expiresAt: number;
}

const windows = new Map<string, Window>();

/**
 * Sweep once the Map is bigger than this. Sized well above any plausible
 * concurrent-caller count so a normal instance never pays for the sweep.
 */
const SWEEP_THRESHOLD = 10_000;

/** Drop every window whose newest timestamp has already aged out. */
function sweepExpired(now: number): void {
  for (const [key, window] of windows) {
    if (window.expiresAt <= now) windows.delete(key);
  }
}

/**
 * Returns `true` if the request is allowed, `false` if it is rate-limited.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (windows.size > SWEEP_THRESHOLD) sweepExpired(now);

  const existing = windows.get(key);
  const recent = existing
    ? existing.timestamps.filter((t) => t > cutoff)
    : [];

  if (recent.length >= limit) {
    // expiresAt tracks the NEWEST timestamp, not the oldest: the window is
    // only safe to sweep once every timestamp in it has aged out. Keying it
    // off the oldest would let the sweep drop a window that still holds live
    // hits, which is precisely the fail-open this change exists to avoid.
    const newest = recent[recent.length - 1] ?? now;
    windows.set(key, { timestamps: recent, expiresAt: newest + windowMs });
    return false;
  }

  windows.set(key, {
    timestamps: [...recent, now],
    expiresAt: now + windowMs,
  });
  return true;
}

/** Test seam: drop all state. Not used in application code. */
export function __resetRateLimitState(): void {
  windows.clear();
}
