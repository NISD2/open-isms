/**
 * Audit Log — Tamper-evident trail of all compliance-relevant actions
 *
 * Required by NIS2 for accountability. Append-only by design.
 * Each entry stores before/after snapshots as JSONB (the one legitimate JSONB use case).
 *
 * References: companies, users
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";

/** How an action reached the app: a person in the app, or an AI assistant through the MCP server. */
export const AUDIT_VIAS = ["app", "mcp"] as const;
export type AuditVia = (typeof AUDIT_VIAS)[number];

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => company.id),
    userId: uuid("user_id").references(() => user.id),

    // What happened
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id"),

    // Details
    description: text("description").notNull(),
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    /**
     * Whether an assistant's key made the call. Its own column, not read off `user_agent`: a
     * filter needs no pattern, and erasure clears the user agent (lib/gdpr/scrub-audit-log.ts)
     * but not how the action was taken.
     */
    via: varchar("via", { length: 8 }).$type<AuditVia>().default("app").notNull(),

    // Tamper detection
    checksum: varchar("checksum", { length: 64 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_company").on(table.companyId),
    index("idx_audit_entity").on(table.entityType, table.entityId),
    index("idx_audit_created").on(table.createdAt),
    // "the last thing this company did", which the journey page asks on every
    // load (server/trpc/routers/journey.ts, lastActivityAt). Neither
    // single-column index answers it: idx_audit_company finds the company's
    // rows and then Postgres sorts all of them to take one, and
    // idx_audit_created walks newest-first across every tenant until it
    // happens on this one -- unbounded for a company that has been quiet.
    // Leading with company_id and ordering by created_at makes it a scan of
    // one index that stops at the first row.
    index("idx_audit_company_created").on(table.companyId, table.createdAt),
    // "what assistants did", per company or across all: a few rows among many.
    index("idx_audit_mcp_company_created")
      .on(table.companyId, table.createdAt)
      .where(sql`${table.via} = 'mcp'`),
    check(
      "audit_log_via",
      sql`${table.via} in (${sql.raw(AUDIT_VIAS.map((via) => `'${via}'`).join(", "))})`,
    ),
  ],
);
