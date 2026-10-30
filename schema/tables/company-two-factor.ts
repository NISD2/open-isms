import { company, user } from "@nisd2/isms-schema/tables/organization";
import { boolean, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * A company's rule for two-factor sign-in (lib/auth/two-factor): when `required`, everyone in it
 * signs in with a code from an authenticator app on top of the password, and a member without the
 * app set up sets it up at their next password sign-in. An admin's switch in Settings. No row means
 * not required.
 */
export const companyTwoFactor = pgTable("company_two_factor", {
  companyId: uuid("company_id")
    .primaryKey()
    .references(() => company.id, { onDelete: "cascade" }),
  required: boolean("required").default(false).notNull(),
  /** The admin who last changed it. */
  updatedBy: uuid("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
