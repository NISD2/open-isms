import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as authSchema from "./schema/auth";

// Build-time tolerance: pg.Client() only validates the URL when you call
// .connect(). With a placeholder URL we can create the client + drizzle
// wrapper at module load (so Auth.js's DrizzleAdapter can introspect the
// db type), and defer the actual connection until first runtime use.
const url =
  process.env.DATABASE_URL ?? "postgres://placeholder:placeholder@localhost:5432/placeholder";

const client = new Client({ connectionString: url });
export const db = drizzle(client, { schema: authSchema });

let connectPromise: Promise<unknown> | null = null;

export async function ensureDbConnected() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required at runtime (not set in env)");
  }
  if (!connectPromise) connectPromise = client.connect();
  await connectPromise;
}
