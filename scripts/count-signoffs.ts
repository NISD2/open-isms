import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const r = await db.execute<{ framework: string; cnt: number }>(sql`
  SELECT f.code AS framework, count(*)::int AS cnt
  FROM company_requirement_status s
  JOIN requirement r ON r.id = s.requirement_id
  JOIN requirement_category c ON c.id = r.category_id
  JOIN compliance_framework f ON f.id = c.framework_id
  WHERE s.status IN ('completed', 'approved')
  GROUP BY f.code
  ORDER BY f.code
`);
console.log("Sign-offs by framework:", r.rows);
process.exit(0);
