import { user } from "@nisd2/isms-schema/tables/organization";
import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * A person's second factor for password sign-ins: a code from an authenticator app (TOTP,
 * RFC 6238), plus one-time recovery codes for a lost phone (lib/auth/two-factor).
 *
 * One row per person, made when they first start setting it up. The app's secret is stored
 * encrypted with TWO_FACTOR_ENCRYPTION_KEY, the recovery codes only as SHA-256 hashes, so a
 * database read alone gives no code. Setting up writes the pending columns; the first correct
 * code moves them to the active ones. Removed with the person (erasure).
 */
export const userTwoFactor = pgTable(
  "user_two_factor",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The app's secret, encrypted (lib/auth/two-factor/crypto.ts). Null until set up. */
    secretEncrypted: text("secret_encrypted"),
    /** When the person confirmed their first code. Null means the second factor is off. */
    enabledAt: timestamp("enabled_at"),
    /** SHA-256 of each recovery code not used yet. */
    recoveryCodeHashes: text("recovery_code_hashes").array().notNull().default(sql`'{}'`),
    /**
     * The newest 30-second step a code was accepted for. A code is accepted only for a later
     * step, so one seen over someone's shoulder cannot be used a second time.
     */
    lastUsedStep: integer("last_used_step").default(0).notNull(),
    /**
     * Wrong codes in a row since the last right one (lib/auth/two-factor/store.ts). At 10 the
     * person is emailed; at 100 codes from the app are refused until a recovery code works or a
     * platform admin resets the second factor.
     */
    failedAttempts: integer("failed_attempts").default(0).notNull(),
    /** A setup started and not confirmed yet: its secret, recovery codes and start time. */
    pendingSecretEncrypted: text("pending_secret_encrypted"),
    pendingRecoveryCodeHashes: text("pending_recovery_code_hashes").array(),
    pendingStartedAt: timestamp("pending_started_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "user_two_factor_enabled_whole",
      sql`(${table.enabledAt} is null) = (${table.secretEncrypted} is null)`,
    ),
    check(
      "user_two_factor_pending_whole",
      sql`(${table.pendingStartedAt} is null) = (${table.pendingSecretEncrypted} is null)
        and (${table.pendingStartedAt} is null) = (${table.pendingRecoveryCodeHashes} is null)`,
    ),
    check(
      "user_two_factor_off_without_codes",
      sql`${table.enabledAt} is not null or cardinality(${table.recoveryCodeHashes}) = 0`,
    ),
  ],
);
