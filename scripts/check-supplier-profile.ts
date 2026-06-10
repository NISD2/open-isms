import { db } from "@/lib/db";
const tables = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'supplier%' OR table_name='supplier_profile'");
console.log("supplier-* tables:", tables.rows);
const journal = await db.execute("SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5");
console.log("\nrecent migrations applied:", journal.rows);
process.exit(0);
