import { index, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Rate-limit windows, one row per limiter key (lib/rate-limit.ts).
 *
 * A fixed window: the first hit sets `reset_at`, later hits count up to the
 * caller's limit, and the first hit after `reset_at` starts a new window. It
 * lives here rather than in process memory so a redeploy does not hand every
 * caller a fresh budget and a second replica does not double every limit.
 *
 * Lifecycle:
 *  - INSERT or UPDATE on every allowed hit, in one statement
 *  - DELETE once `reset_at` has passed, a batch at a time from the hit path
 */
export const rateLimitWindow = pgTable(
  "rate_limit_window",
  {
    /**
     * sha256 of the limiter key. The keys carry client IPs, email addresses and
     * gap-share tokens, none of which belong in a table or its backups.
     */
    key: varchar("key", { length: 64 }).primaryKey(),
    /** Hits allowed in the current window. A denied hit writes nothing. */
    count: integer("count").notNull(),
    /**
     * With time zone, unlike most tables here, because it is only ever set from
     * and compared with the database clock (`now()`, a timestamptz). A plain
     * timestamp would convert through the session time zone on both sides.
     */
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("idx_rate_limit_window_cleanup").on(table.resetAt)],
);
