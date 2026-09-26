/**
 * Platform switches flipped at runtime from platform admin, such as launching billing to customers.
 * A switch with no row is off, so a fresh install or a self-hoster starts with everything off.
 */

import { boolean, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { featureFlagKeyEnum } from "../enums";
import { user } from "./organization";

export const featureFlag = pgTable("feature_flag", {
  key: featureFlagKeyEnum("key").primaryKey(),
  enabled: boolean("enabled").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedByUserId: uuid("updated_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
});
