import {
  pgTable,
  uuid,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { incident, supplier } from "@nisd2/grc-data-model/schema";
import { supplierPublicationBroadcastStatusEnum } from "../enums";

export const incidentBroadcast = pgTable(
  "incident_broadcast",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    incidentId: uuid("incident_id")
      .references(() => incident.id, { onDelete: "cascade" })
      .notNull(),
    customerRelationshipId: uuid("customer_relationship_id")
      .references(() => supplier.id, { onDelete: "cascade" })
      .notNull(),
    status: supplierPublicationBroadcastStatusEnum("status")
      .default("queued")
      .notNull(),
    sentAt: timestamp("sent_at"),
    deliveryCount: integer("delivery_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_incident_broadcast_incident").on(table.incidentId),
    index("idx_incident_broadcast_relationship").on(table.customerRelationshipId),
    index("idx_incident_broadcast_status").on(table.status),
  ],
);
