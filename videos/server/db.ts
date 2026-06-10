import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.PIPELINE_DATABASE_URL;
if (!url) throw new Error("PIPELINE_DATABASE_URL is required");
const client = postgres(url);
export const db = drizzle(client, { schema });
