/**
 * The half of the rate limiter that needs no database: which key and budget a
 * request counts against, and how this process decides a hit around the shared
 * count that lib/rate-limit.ts keeps in Postgres. Kept apart so the unit suite
 * can pin all of it without DATABASE_URL.
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

/** What the shared count says about one hit. */
export type HitVerdict =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly resetInMs: number };

export type CountHit = (
  rowKey: string,
  limit: number,
  windowMs: number,
) => Promise<HitVerdict>;

export type Limiter = (key: string, limit: number, windowMs: number) => Promise<boolean>;

export type LimiterOptions = {
  readonly countHit: CountHit;
  /** Monotonic milliseconds; injected so tests can move time. */
  readonly now?: () => number;
  readonly logOutage?: (error: unknown) => void;
  readonly timeoutMs?: number;
  readonly outageBackoffMs?: number;
  readonly maxDenials?: number;
};

type Denial = { readonly until: number; readonly limit: number };

const withTimeout = <T>(work: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no answer within ${ms} ms`)), ms);
    work.then(resolve, reject).finally(() => clearTimeout(timer));
  });

/**
 * Builds the process's limiter around the shared count. Three things live in
 * process memory, none of which can let through a hit the database would deny.
 *
 * One hit per key at a time. Hits on a key wait for each other here instead of
 * in the connection pool. Postgres serialises them on the row anyway, so this
 * costs no throughput, and it stops a burst at one key from holding every pooled
 * connection: measured locally on 30.09.2026, 2000 parallel hits at one key held
 * the app's ten connections for about 440 ms and pushed an unrelated `select 1`
 * from under 2 ms to about 330 ms. It is also what makes the timeout below safe:
 * with remembered denials but no queue, the same burst waited in the pool past
 * the timeout and all 2000 hits were allowed.
 *
 * Denials remembered until the window resets. Once the database denies a key,
 * this process denies it from memory until reset_at, without a round trip, so
 * a waiting burst drains without touching the database. Only denials are
 * remembered, and the database would give the same answer: a window's count
 * never drops before it resets. A denial covers limits up to the one it was
 * made for. The memory is capped and drops its oldest entry when full, which
 * only sends that key back to the database, where it is still denied.
 *
 * FAILS OPEN, and this is the only place that decides it. When a hit cannot be
 * counted (database unreachable, statement error, or no answer within
 * `timeoutMs`, since nothing else in the pool times out) the request is allowed.
 * Most routes behind this limiter need the same database for their own work, so
 * during an outage the request fails at its next query anyway, and failing
 * closed would turn a fault in the limiter alone into every user locked out of
 * login. The cost: while the limiter is down, the routes that work without the
 * database lose their ceiling. Those are the public questionnaire PDF and DOCX,
 * and the applicability company search, which calls the paid RapidAPI before
 * it touches the database. After a failure the process allows every hit for
 * `outageBackoffMs` without asking and logs once, so a hanging database costs
 * one request a timeout rather than queueing each key's hits behind one another.
 * The timeout covers the database call and not the wait behind earlier hits on
 * the same key, so a burst cannot time its own hits out into being allowed; a
 * pool held by other traffic for longer than `timeoutMs` does read as an outage.
 */
export function createLimiter({
  countHit,
  now = () => performance.now(),
  logOutage = (error) =>
    console.error("[rate-limit] limiter unavailable, allowing requests:", error),
  timeoutMs = 500,
  outageBackoffMs = 5_000,
  maxDenials = 10_000,
}: LimiterOptions): Limiter {
  const denials = new Map<string, Denial>();
  const queues = new Map<string, Promise<boolean>>();
  // The outage state is one moving timestamp, so it is a let.
  let downUntil = Number.NEGATIVE_INFINITY;

  const isRemembered = (rowKey: string, limit: number, at: number): boolean => {
    const denial = denials.get(rowKey);
    if (denial === undefined) return false;
    if (denial.until <= at) {
      denials.delete(rowKey);
      return false;
    }
    return limit <= denial.limit;
  };

  const remember = (rowKey: string, denial: Denial): void => {
    denials.delete(rowKey);
    const oldest = denials.size >= maxDenials ? denials.keys().next() : undefined;
    if (oldest !== undefined && !oldest.done) denials.delete(oldest.value);
    denials.set(rowKey, denial);
  };

  const decide = async (rowKey: string, limit: number, windowMs: number) => {
    if (isRemembered(rowKey, limit, now())) return false;
    if (now() < downUntil) return true;
    try {
      const verdict = await withTimeout(countHit(rowKey, limit, windowMs), timeoutMs);
      if (!verdict.allowed) remember(rowKey, { until: now() + verdict.resetInMs, limit });
      return verdict.allowed;
    } catch (error) {
      if (now() >= downUntil) logOutage(error);
      downUntil = now() + outageBackoffMs;
      return true;
    }
  };

  return (key, limit, windowMs) => {
    const rowKey = windowKey(key);
    const run = () => decide(rowKey, limit, windowMs);
    const current = (queues.get(rowKey) ?? Promise.resolve(true)).then(run, run);
    queues.set(rowKey, current);
    return current.finally(() => {
      if (queues.get(rowKey) === current) queues.delete(rowKey);
    });
  };
}
