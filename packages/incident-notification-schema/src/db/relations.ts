import { relations } from "drizzle-orm";
import {
  incidentNotificationReport,
  incidentNotificationValue,
} from "./tables";

export const incidentNotificationReportRelations = relations(
  incidentNotificationReport,
  ({ many, one }) => ({
    values: many(incidentNotificationValue),
    parent: one(incidentNotificationReport, {
      fields: [incidentNotificationReport.parentReportId],
      references: [incidentNotificationReport.id],
      relationName: "reportCascade",
    }),
    children: many(incidentNotificationReport, {
      relationName: "reportCascade",
    }),
  }),
);

export const incidentNotificationValueRelations = relations(
  incidentNotificationValue,
  ({ one }) => ({
    report: one(incidentNotificationReport, {
      fields: [incidentNotificationValue.reportId],
      references: [incidentNotificationReport.id],
    }),
  }),
);
