import {
  pgTable,
  uuid,
  varchar,
  smallint,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Email OTP records — one row per one-time code issued.
 *
 * Polymorphic by `purpose` (varchar, app-validated) so the same substrate
 * powers signup email verification today and login-time MFA / password
 * reset later. The plaintext code is never stored — only a bcrypt hash —
 * so a DB read does not leak verification material.
 *
 * Lifecycle:
 *  - INSERT on `requestOtp`
 *  - UPDATE attempts on each failed `verifyOtp`
 *  - UPDATE consumedAt on success OR on attempt-limit lockout
 *  - DELETE on cleanup cron (rows older than 24h)
 */
export const emailOtp = pgTable(
  "email_otp",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Normalized lowercase email. Not FK'd to user.email because users may
     * not exist yet (signup verification flow) and historical rows must
     * survive user deletion. */
    email: varchar("email", { length: 255 }).notNull(),
    /** bcrypt hash of the 6-digit plaintext code. */
    codeHash: varchar("code_hash", { length: 255 }).notNull(),
    /**
     * Purpose discriminator. Current values: "email_verify" (registration)
     * and "password_reset". Validated at application level (see
     * lib/auth/otp.ts) to avoid migration friction when adding values.
     */
    purpose: varchar("purpose", { length: 32 }).notNull(),
    /** Wrong-code attempts. At MAX_ATTEMPTS the record is consumed. */
    attempts: smallint("attempts").default(0).notNull(),
    /** Set on successful verify OR on lockout. NULL = still active. */
    consumedAt: timestamp("consumed_at"),
    /** Hard expiry irrespective of attempts. Default 10 minutes. */
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_email_otp_lookup").on(table.email, table.purpose),
    index("idx_email_otp_cleanup").on(table.expiresAt),
  ],
);
