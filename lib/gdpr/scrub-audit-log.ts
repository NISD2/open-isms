/**
 * The audit trail's copy of an erased person.
 *
 * Rows the person wrote carry their user id. Rows written about them often do
 * not: a failed email records the recipient's address with no user id, and
 * the course-reminder cron wrote the address into the description. Erasure
 * matched on the user id alone, so those addresses stayed in the trail after
 * the certificate said they were gone.
 *
 * A row is therefore also found by the address itself, in the description or
 * in either JSON value, the places the writers put it. SQL narrows the rows to
 * those holding the address as a substring; only those holding it as a whole
 * address are touched, because the substring anna@web.de is also inside
 * hanna@web.de, which belongs to somebody else. Its own module because
 * erase-user.ts pulls in environment validation and this deserves tests.
 */
import { eq, or, sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { auditLog } from "@/schema";
import { mentionsAddress } from "./address-match";

/**
 * Redact every audit row by or mentioning the person, and return how many.
 * The user id is cleared only on rows that were the person's: a row about
 * them written by someone else still names its author.
 */
export async function scrubAuditTrail(
  tx: DbOrTx,
  person: { userId: string; email: string },
  redact: <T>(value: T) => T,
): Promise<number> {
  const address = person.email.trim().toLowerCase();
  const byPerson = eq(auditLog.userId, person.userId);
  const rows = await tx
    .select({
      id: auditLog.id,
      userId: auditLog.userId,
      description: auditLog.description,
      previousValue: auditLog.previousValue,
      newValue: auditLog.newValue,
    })
    .from(auditLog)
    .where(
      // An empty needle is a substring of every row, which would rewrite the whole trail.
      address === ""
        ? byPerson
        : or(
            byPerson,
            sql`strpos(lower(${auditLog.description}), ${address}) > 0`,
            sql`strpos(lower(${auditLog.previousValue}::text), ${address}) > 0`,
            sql`strpos(lower(${auditLog.newValue}::text), ${address}) > 0`,
          ),
    );
  const affected = rows.filter(
    (row) =>
      row.userId === person.userId ||
      [row.description, row.previousValue, row.newValue].some((value) =>
        mentionsAddress(value, address),
      ),
  );
  for (const row of affected) {
    await tx
      .update(auditLog)
      .set({
        ...(row.userId === person.userId ? { userId: null } : {}),
        description: redact(row.description),
        previousValue: redact(row.previousValue),
        newValue: redact(row.newValue),
      })
      .where(eq(auditLog.id, row.id));
  }
  return affected.length;
}
