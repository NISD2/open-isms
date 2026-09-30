/**
 * The pure half of the rate limiter: which key and which budget a request
 * counts against. Kept apart from lib/rate-limit.ts, which needs the database,
 * so the unit suite can pin these without DATABASE_URL.
 */
import { createHash } from "node:crypto";

export type Budget = {
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
};

/**
 * The row key a limiter key is stored under. Keys embed client IPs, email
 * addresses and gap-share tokens; hashing keeps them out of the table and its
 * backups, and gives every row the same 64 characters however long the key.
 */
export function windowKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Per-IP budget for an unauthenticated route, with a sane answer for the
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
export function publicRouteBudget(
  name: string,
  ip: string,
  perIpPerMinute: number,
): Budget {
  return ip === "unknown"
    ? { key: `${name}:no-client-ip`, limit: perIpPerMinute * 12, windowMs: 60_000 }
    : { key: `${name}:${ip}`, limit: perIpPerMinute, windowMs: 60_000 };
}
