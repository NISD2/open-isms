/**
 * Auth.js standard tables for the OSS open-isms app.
 *
 * Deliberately separate from `packages/isms-schema`'s `user` table:
 *
 *   isms-schema.user        — SaaS-specific (companyId, role, jobTitle,
 *                             passwordHash, emailVerifiedAt). Used by
 *                             the private nisd2.eu app.
 *   apps/reference.auth_user — OSS-only, Auth.js-standard shape. Tracks
 *                             who signed in via email magic link.
 *
 * Why two tables and not one: keeps the OSS auth surface independent of
 * the ISMS domain. When the ISMS portal pages are ported in later, an
 * `auth_user.id` → `isms-schema.user.id` mapping is added then. For now,
 * auth_user is all you need to know "this email proved control of itself
 * by clicking the link in the magic-link email."
 *
 * Two tables, JWT session strategy (no session table needed), no OAuth
 * providers (no account table needed). If a future contributor wants to
 * add OAuth, add the standard `auth_account` and `auth_session` tables
 * here and switch the strategy in `lib/auth.ts`.
 */

import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const authUser = pgTable("auth_user", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .default(sql`now()`),
});

// Accounts table is required by @auth/drizzle-adapter's type signature
// even though we don't use OAuth (JWT + Email only). Stays empty.
export const authAccount = pgTable(
  "auth_account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

// Sessions table is required by the type signature. Unused at runtime
// because we set session.strategy = "jwt" in lib/auth.ts.
export const authSession = pgTable("auth_session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const authVerificationToken = pgTable(
  "auth_verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);
