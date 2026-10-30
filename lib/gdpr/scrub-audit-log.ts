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
 *
 * A row about the person (entity "user", their id) is found by that id too,
 * whoever wrote it, and its `reason` is replaced: a platform admin's
 * two-factor reset carries the operator's free text about how the person was
 * verified (lib/auth/two-factor/audit.ts), which can name them.
 */
import { and, eq, or, sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { auditLog } from "@/schema";
import { mentionsAddress } from "./address-match";
import { ERASED_REASON } from "./erase-reasons";

/** A JSON value with its top-level `reason` replaced, when it has one. */
const withoutReason = (value: unknown): unknown =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  "reason" in value
    ? { ...value, reason: ERASED_REASON }
    : value;

/**
 * Redact every audit row by, about or mentioning the person, and return how
 * many. The user id, IP address and browser are cleared only on rows that
 * were the person's: a row about them written by someone else still names its
 * author, and that address and browser are the author's.
 */
export async function scrubAuditTrail(
  tx: DbOrTx,
  person: { userId: string; email: string },
  redact: <T>(value: T) => T,
): Promise<number> {
  const address = person.email.trim().toLowerCase();
  const byPerson = eq(auditLog.userId, person.userId);
  const aboutPerson = and(
    eq(auditLog.entityType, "user"),
    eq(auditLog.entityId, person.userId),
  );
  const rows = await tx
    .select({
      id: auditLog.id,
      userId: auditLog.userId,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      description: auditLog.description,
      previousValue: auditLog.previousValue,
      newValue: auditLog.newValue,
    })
    .from(auditLog)
    .where(
      // An empty needle is a substring of every row, which would rewrite the whole trail.
      address === ""
        ? or(byPerson, aboutPerson)
        : or(
            byPerson,
            aboutPerson,
            sql`strpos(lower(${auditLog.description}), ${address}) > 0`,
            sql`strpos(lower(${auditLog.previousValue}::text), ${address}) > 0`,
            sql`strpos(lower(${auditLog.newValue}::text), ${address}) > 0`,
          ),
    );
  const isAbout = (row: (typeof rows)[number]) =>
    row.entityType === "user" && row.entityId === person.userId;
  const affected = rows.filter(
    (row) =>
      row.userId === person.userId ||
      isAbout(row) ||
      [row.description, row.previousValue, row.newValue].some((value) =>
        mentionsAddress(value, address),
      ),
  );
  for (const row of affected) {
    const about = isAbout(row);
    await tx
      .update(auditLog)
      .set({
        ...(row.userId === person.userId
          ? { userId: null, ipAddress: null, userAgent: null }
          : {}),
        description: redact(row.description),
        previousValue: redact(
          about ? withoutReason(row.previousValue) : row.previousValue,
        ),
        newValue: redact(about ? withoutReason(row.newValue) : row.newValue),
      })
      .where(eq(auditLog.id, row.id));
  }
  return affected.length;
}
