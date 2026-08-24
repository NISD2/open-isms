/**
 * Refuse to run against anything but a local database.
 *
 * For scripts that destroy or overwrite data. Connection-shaped rather than a
 * boolean env flag, and that distinction is the whole point: a flag gets set
 * once, lands in .env next to the production DATABASE_URL, and is then quietly
 * true for every run afterwards including the one nobody meant to make. A host
 * cannot be set and forgotten, because it IS the thing being pointed at.
 *
 * NODE_ENV is worse than useless here, which is why this exists. `bun run`
 * leaves it undefined, so a `NODE_ENV === "production"` check never fires under
 * the invocation these scripts document; and the Dockerfile sets it to
 * "production", so the same check fires only inside the image, the one place
 * the scripts never run. Inverted in both directions.
 *
 * Honest about its limit: this stops an accident, not a determined foot-gun. A
 * production database fronted by `ssh -L` or a local proxy presents as
 * localhost and passes.
 *
 * Extracted from scripts/smoke-supplier-portal.ts, which had it right.
 */
const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function assertLocalDatabase(databaseUrl: string, whatItDoes: string): void {
  // Parse defensively: a malformed connection string makes URL throw with the
  // whole string, password included, attached to the error — and callers log
  // errors to the console.
  const url = (() => {
    try {
      return new URL(databaseUrl);
    } catch {
      throw new Error("Refusing to run: DATABASE_URL is not a valid connection URL.");
    }
  })();

  // pg-connection-string, which is what pg actually parses this with, gives the
  // `host` query parameter priority over the URL authority. So
  // `postgres://u:p@localhost/db?host=prod.internal` reads as local here while
  // connecting to prod. Check the host pg will really use, not the pretty one.
  const effectiveHost = url.searchParams.get("host") ?? url.hostname;

  if (!LOCAL_DB_HOSTS.has(effectiveHost)) {
    throw new Error(
      `Refusing to run: DATABASE_URL host "${effectiveHost}" is not a local database.\n` +
        `${whatItDoes}\n` +
        "Point DATABASE_URL at a local database and re-run.",
    );
  }
}
