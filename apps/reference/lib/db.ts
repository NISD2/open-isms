import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./schema/auth";

// Build-time tolerance: pg.Pool() only validates the URL when a query first
// needs a connection. With a placeholder URL we can create the pool + drizzle
// wrapper at module load (so Auth.js's DrizzleAdapter can introspect the db
// type) without touching the network during `next build`.
//
// A Pool, not a Client: Auth.js calls the DrizzleAdapter from the sign-in
// route without going through any page, so nothing there can call
// ensureDbConnected() first. An unconnected pg.Client queues those queries
// forever and the sign-in request hangs with no error. A Pool connects on
// demand per query, so every caller works whether or not it opted in.
const url =
  process.env.DATABASE_URL ?? "postgres://placeholder:placeholder@localhost:5432/placeholder";

const pool = new Pool({ connectionString: url });
export const db = drizzle(pool, { schema: authSchema });

/**
 * Fail fast with a readable error instead of a connection-refused stack out of
 * the query layer. Pages call this before their first query; the auth routes
 * do not need it because the pool connects on demand.
 */
export async function ensureDbConnected() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required at runtime (not set in env)");
  }
  const connection = await pool.connect();
  connection.release();
}
