import "@/lib/server-guard";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  like,
  lt,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { assistantOf } from "@/lib/mcp/agent";
import { auditLog, company, companyMembership, user } from "@/schema";

/**
 * The platform operator's reads of people: who signed in lately, one person's account and
 * companies, and what they, a company or everyone did. The admin pages
 * (server/trpc/routers/platform-admin-users.ts) and the test endpoint (lib/test-mcp) both call
 * these, so the two never disagree.
 */

/**
 * Everyone who signed in since `since` or did anything since then, the latest of the two first.
 * `lastLoginAt` moves once per completed sign-in and never on the silent token refreshes
 * (lib/auth/config.ts), so a session that stays open for days shows no sign-in while its owner
 * works; the audit log shows that work. Either one makes a person active. Operators reading the
 * platform (entity type `platformAdmin`, which holds every `test.read`) are not product use and
 * are left out of the actions. The company is the one the person last worked in.
 */
export function activeUsers(db: DbOrTx, since: Date, limit = 1000) {
  // Bare UTC timestamps, compared as an ISO string cast, never as a local Date (lib/test-mcp/common).
  const sinceUtc = sql`${since.toISOString()}::timestamp`;
  const actors = db.$with("actors").as(
    db
      .select({
        userId: auditLog.userId,
        lastActionAt: sql<Date>`max(${auditLog.createdAt})`.as("last_action_at"),
      })
      .from(auditLog)
      .where(
        and(
          isNotNull(auditLog.userId),
          gte(auditLog.createdAt, sinceUtc),
          ne(auditLog.entityType, "platformAdmin"),
        ),
      )
      .groupBy(auditLog.userId),
  );
  return (
    db
      .with(actors)
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lastActionAt: sql<
          string | null
        >`to_char(${actors.lastActionAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
        loginCount: user.loginCount,
        companyId: company.id,
        companyName: company.name,
      })
      .from(user)
      .leftJoin(actors, eq(actors.userId, user.id))
      .leftJoin(company, eq(user.companyId, company.id))
      .where(or(gte(user.lastLoginAt, since), isNotNull(actors.lastActionAt)))
      // GREATEST ignores a null side, so a person with only one of the two still sorts by it.
      .orderBy(desc(sql`greatest(${user.lastLoginAt}, ${actors.lastActionAt})`))
      .limit(limit)
  );
}

/** One person's account and every company they belong to; null for an id that names nobody. */
export async function personWithCompanies(db: DbOrTx, id: string) {
  const [person, memberships] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        loginCount: true,
        grandfatheredAt: true,
      },
    }),
    db
      .select({
        companyId: company.id,
        companyName: company.name,
        role: companyMembership.role,
        jobTitle: companyMembership.jobTitle,
        since: companyMembership.createdAt,
      })
      .from(companyMembership)
      .innerJoin(company, eq(company.id, companyMembership.companyId))
      .where(eq(companyMembership.userId, id))
      .orderBy(desc(companyMembership.createdAt)),
  ]);
  return person ? { person, memberships } : null;
}

/** Whose audit log: one person's (in every company), one company's (every member), or everyone's. */
export type AuditSubject =
  | { readonly kind: "user"; readonly id: string }
  | { readonly kind: "company"; readonly id: string }
  | { readonly kind: "everyone" };

/** Narrows an audit log; every field left out keeps every row. */
export interface AuditFilter {
  /** Rows whose action starts with one of these, e.g. "durchgang." or "trainingPortal.". */
  readonly actionPrefixes?: readonly string[];
  readonly entityType?: string;
  /** For a person's log: only rows in this company. */
  readonly companyId?: string;
  /** Rows on or after this calendar day in Berlin, YYYY-MM-DD. */
  readonly fromDay?: string;
  /** Rows on or before this calendar day in Berlin, YYYY-MM-DD. */
  readonly toDay?: string;
  /** Rows after this one in the order the log is read: the previous page's `nextCursor`. */
  readonly cursor?: AuditCursor;
  /** Rows whose action or description holds this text, any case. */
  readonly text?: string;
  /** Only what an AI assistant did with a person's key, or only what people did in the app. */
  readonly via?: "assistant" | "app";
  /** Leave out rows no person made (scheduled jobs, outbound mail). */
  readonly peopleOnly?: boolean;
}

/**
 * Where a page of the log ended: its last row's time, as the database holds it (microseconds,
 * which a JavaScript Date would round away), and its id, since one change can write several rows
 * at the same moment.
 */
export interface AuditCursor {
  readonly at: string;
  readonly id: string;
}

/** As LIKE reads it literally: its wildcards and its escape character escaped. */
export const literal = (text: string): string => text.replace(/[\\%_]/g, "\\$&");

const ASSISTANT_AGENT = "mcp: %";

/**
 * Midnight starting a Berlin calendar day, as the bare UTC timestamps of audit_log store it.
 * Computed in the database, so summer and winter time come out right and the index on
 * created_at still serves the range.
 */
export const berlinMidnight = (day: string, plusDays: 0 | 1) =>
  sql`(((${day}::date + ${plusDays}::int)::timestamp at time zone 'Europe/Berlin') at time zone 'UTC')`;

/** The rows of a bare-timestamp column between two Berlin calendar days, both included. */
export const betweenDays = (
  column: Parameters<typeof gte>[0],
  fromDay: string | undefined,
  toDay: string | undefined,
) =>
  and(
    fromDay ? gte(column, berlinMidnight(fromDay, 0)) : undefined,
    toDay ? lt(column, berlinMidnight(toDay, 1)) : undefined,
  );

const subjectOf = (s: AuditSubject) =>
  s.kind === "user"
    ? eq(auditLog.userId, s.id)
    : s.kind === "company"
      ? eq(auditLog.companyId, s.id)
      : undefined;

const filterOf = (subject: AuditSubject, f: AuditFilter) =>
  and(
    subjectOf(subject),
    f.actionPrefixes?.length
      ? or(...f.actionPrefixes.map((p) => like(auditLog.action, `${literal(p)}%`)))
      : undefined,
    f.entityType ? eq(auditLog.entityType, f.entityType) : undefined,
    f.companyId ? eq(auditLog.companyId, f.companyId) : undefined,
    f.fromDay ? gte(auditLog.createdAt, berlinMidnight(f.fromDay, 0)) : undefined,
    f.toDay ? lt(auditLog.createdAt, berlinMidnight(f.toDay, 1)) : undefined,
    f.cursor
      ? sql`(${auditLog.createdAt}, ${auditLog.id}) < (${f.cursor.at}::timestamp, ${f.cursor.id}::uuid)`
      : undefined,
    f.text
      ? or(
          ilike(auditLog.action, `%${literal(f.text)}%`),
          ilike(auditLog.description, `%${literal(f.text)}%`),
        )
      : undefined,
    f.via === "assistant" ? like(auditLog.userAgent, ASSISTANT_AGENT) : undefined,
    f.via === "app"
      ? or(isNull(auditLog.userAgent), not(like(auditLog.userAgent, ASSISTANT_AGENT)))
      : undefined,
    f.peopleOnly ? isNotNull(auditLog.userId) : undefined,
  );

/**
 * An audit log, newest first: what each entry says happened, who did it, the values it stored, and
 * the assistant that did it when one did. The values are as stored. The tRPC audit step redacts a
 * short list of keys (packages/isms-trpc/src/init.ts), but the direct `logAudit` callers redact
 * nothing, so a stored value or a description can hold an email or IP address. The IP address
 * column stays in the log. `nextCursor` reads on from the last row; null when the page was the last.
 */
export async function auditLogFor(
  db: DbOrTx,
  subject: AuditSubject,
  filter: AuditFilter,
  limit: number,
) {
  const rows = await db
    .select({
      id: auditLog.id,
      at: auditLog.createdAt,
      exactAt: sql<string>`to_char(${auditLog.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS.US')`,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      description: auditLog.description,
      previousValue: auditLog.previousValue,
      newValue: auditLog.newValue,
      userId: auditLog.userId,
      userEmail: user.email,
      companyId: auditLog.companyId,
      companyName: company.name,
      userAgent: auditLog.userAgent,
    })
    .from(auditLog)
    .leftJoin(company, eq(company.id, auditLog.companyId))
    .leftJoin(user, eq(user.id, auditLog.userId))
    .where(filterOf(subject, filter))
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(limit);
  const last = rows.at(-1);
  return {
    // Each row carries the cursor that reads on from it, so a caller that cannot show the whole
    // page can stop at any row and still continue exactly after it.
    rows: rows.map(({ userAgent, exactAt, ...row }) => ({
      ...row,
      assistant: assistantOf(userAgent),
      cursor: { at: exactAt, id: row.id } satisfies AuditCursor,
    })),
    nextCursor: last && rows.length === limit ? { at: last.exactAt, id: last.id } : null,
  };
}
