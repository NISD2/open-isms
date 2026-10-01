/**
 * What every job that runs inside the app shares (the Close sync, the daily deadlines run): where
 * it may run, and a Postgres advisory lock so one run happens at a time across every server, two
 * containers during a deploy or a schedule and a manual call alike.
 */
import "@/lib/server-guard";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/** A production build serving a public address: not `next dev`, not a local container. */
export const isDeployedServer = (): boolean => {
  if (process.env.NODE_ENV !== "production") return false;
  try {
    return !LOCAL_HOSTS.has(new URL(env.NEXT_PUBLIC_APP_URL).hostname);
  } catch {
    return false;
  }
};

export type Locked<T> =
  | { readonly locked: true; readonly value: T }
  | { readonly locked: false };

/**
 * Run fn while holding the advisory lock `lockId` on a connection of its own, or report that
 * another run holds it. A checked-out pg client has no pool error listener, so one is attached
 * here: without it a dropped connection would surface as an unhandled 'error' event and take the
 * server down. A connection that failed is destroyed rather than pooled, and its session lock goes
 * with it.
 */
export const withAdvisoryLock = async <T>(
  lockId: number,
  label: string,
  fn: () => Promise<T>,
): Promise<Locked<T>> => {
  const client = await db.$client.connect();
  const onError = (err: Error) =>
    console.error(`[${label}] lock connection lost: ${err.message}`);
  client.on("error", onError);
  const attempt = async (): Promise<Locked<T>> => {
    const { rows } = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [lockId],
    );
    if (!rows[0]?.locked) return { locked: false };
    try {
      return { locked: true, value: await fn() };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [lockId]);
    }
  };
  try {
    const result = await attempt();
    client.release();
    return result;
  } catch (err) {
    client.release(err instanceof Error ? err : true);
    throw err;
  } finally {
    client.off("error", onError);
  }
};
