/**
 * MCP connection — one AI assistant a person connected (lib/mcp): a key pasted from Settings, or
 * an assistant allowed on the consent page. Every key and sign-in token carries its row's id, so
 * the person sees each connection in Settings and ends one without ending the others. Bumping
 * the person's key version (`user.mcp_key_version`) still ends them all at once; a row made under
 * an older version is over too.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";

export const MCP_CONNECTION_KINDS = ["key", "signin"] as const;
export type McpConnectionKind = (typeof MCP_CONNECTION_KINDS)[number];

export const mcpConnection = pgTable(
  "mcp_connection",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The company the connection works in, as its keys do. */
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 16 }).$type<McpConnectionKind>().notNull(),
    /** The name the assistant gave itself when it signed in; none for a pasted key. */
    client: varchar("client", { length: 200 }),
    /** The person's key version when it was made. */
    keyVersion: integer("key_version").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** When its keys stop working whatever happens: 90 days after it was made. */
    expiresAt: timestamp("expires_at").notNull(),
    /** The last call it made, kept to the minute. */
    lastUsedAt: timestamp("last_used_at"),
    /** When the person ended it in Settings, or made a new key in its place. */
    endedAt: timestamp("ended_at"),
  },
  (table) => [
    index("idx_mcp_connection_user_company").on(table.userId, table.companyId),
    check("mcp_connection_kind", sql`${table.kind} in ('key', 'signin')`),
    check(
      "mcp_connection_client_on_signin",
      sql`${table.kind} = 'signin' or ${table.client} is null`,
    ),
    check(
      "mcp_connection_expires_after_made",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);
