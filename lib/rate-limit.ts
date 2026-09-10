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

/** Named RateWindow, not Window, so it cannot shadow the DOM global. */
interface RateWindow {
  timestamps: number[];
  /** When the last timestamp in this window ages out. */
  expiresAt: number;
}

const windows = new Map<string, RateWindow>();

/**
 * Only consider sweeping once the Map is bigger than this. Sized well above
 * any plausible concurrent-caller count so a normal instance never sweeps.
 */
const SWEEP_THRESHOLD = 10_000;

/**
 * And then at most this often.
 *
 * Both guards are needed, and the size one alone is a trap: the sweep is O(n)
 * over the whole Map, so if the entries above the threshold are still LIVE it
 * deletes nothing, the size never drops, and every subsequent call pays a
 * full scan. Measured at 10.050 live windows that is 47 µs/call against
 * 0,20 µs for the unswept map — a 237x regression, reachable by anyone able
 * to put 10.001 distinct keys in play, which is the same "many distinct IPs"
 * the eviction exists to survive. Time-throttling bounds the cost to one scan
 * a minute no matter what the caller does.
 *
 * The trade is that between sweeps the Map holds at most a minute of unique
 * keys rather than none, which is the point: bounded, not zero.
 */
const SWEEP_INTERVAL_MS = 60_000;

/** Timestamp cursor for the throttle above. Mutable for the same reason `windows` is. */
let lastSweptAt = 0;

/** Drop every window whose newest timestamp has already aged out. */
function sweepExpired(now: number): void {
  lastSweptAt = now;
  for (const [key, entry] of windows) {
    if (entry.expiresAt <= now) windows.delete(key);
  }
}

/**
 * Returns `true` if the request is allowed, `false` if it is rate-limited.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (windows.size > SWEEP_THRESHOLD && now - lastSweptAt >= SWEEP_INTERVAL_MS) {
    sweepExpired(now);
  }

  const existing = windows.get(key);
  const recent = existing ? existing.timestamps.filter((t) => t > cutoff) : [];

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

/**
 * Per-IP limit for an unauthenticated route, with a sane answer for the
 * deployments that cannot report an IP.
 *
 * `getClientIp` returns the literal "unknown" when neither `x-real-ip` nor
 * `x-forwarded-for` is present, which is every self-hosted instance started
 * without the optional Caddy proxy profile. Keying on that string would put
 * every visitor to such an instance in ONE bucket, so the eleventh download
 * of the day from anybody 429s. Those callers get their own, much larger
 * shared budget instead: still a ceiling on the CPU an anonymous crowd can
 * burn, without pretending a whole instance is one person.
 *
 * Deployments behind Traefik or Caddy always have the header, so they get the
 * real per-IP limit.
 */
export function rateLimitPublicRoute(
  name: string,
  ip: string,
  perIpPerMinute: number,
): boolean {
  return ip === "unknown"
    ? rateLimit(`${name}:no-client-ip`, perIpPerMinute * 12, 60_000)
    : rateLimit(`${name}:${ip}`, perIpPerMinute, 60_000);
}

/** Test seam: drop all state. Not used in application code. */
export function __resetRateLimitState(): void {
  windows.clear();
  lastSweptAt = 0;
}

/**
 * Test seam: how many windows are being held, and a way to run the sweep
 * without waiting out SWEEP_INTERVAL_MS. Not used in application code — the
 * sweep is what keeps the Map bounded and what must never drop a live window,
 * so it is worth testing directly rather than through a minute-long wait.
 */
export const __rateLimitInternals = {
  windowCount: () => windows.size,
  forceSweep: () => sweepExpired(Date.now()),
};
