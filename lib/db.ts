import "@/lib/server-guard";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/schema";
import { env } from "@/lib/env";

export const db = drizzle(env.DATABASE_URL, { schema });

export type Database = typeof db;

/** Accepts both `db` and `tx` (transaction) — use in helper functions. */
export type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];
