import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Constant-time bearer-token verification for cron endpoints.
 *
 * Audit EW-3 (2026-06-11): the previous `header !== "Bearer ${SECRET}"`
 * pattern is a JS string compare that early-exits on the first
 * mismatching character, giving anyone who can hit /api/cron/* with
 * arbitrary tokens a timing oracle to recover the secret. Constant-time
 * comparison removes that side channel.
 *
 * Returns false on:
 *   - missing or empty Authorization header
 *   - missing or malformed "Bearer " prefix
 *   - length mismatch (length is itself a side channel, but a 100x
 *     coarser one than per-byte; equalising via Buffer.alloc+compare
 *     is possible but adds complexity without meaningful gain)
 *   - constant-time-equal mismatch
 *
 * Callers should still check `env.CRON_SECRET` themselves before calling
 * this so they can return a distinct 500 for "not configured" vs 401
 * for "wrong token" — useful in dev, harmless in prod.
 */
export function verifyCronBearer(req: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = header.slice("Bearer ".length);
  if (provided.length !== secret.length) return false;

  return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
}
