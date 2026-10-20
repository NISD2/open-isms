/**
 * The record of processing activities' inputs, derived from the table (`processing_activity`) so a
 * new column reaches every form and procedure through one pick. Its own module beside
 * validators.ts, which is past the size limit (scripts/check-file-size.ts).
 */
import { processingActivity } from "@nisd2/grc-data-model/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const TEXT = z.string().trim().max(2000);

export const processingActivityInsertSchema = createInsertSchema(processingActivity, {
  name: z.string().trim().min(1).max(255),
  purpose: TEXT,
  dataSubjects: TEXT,
  dataCategories: TEXT,
  recipients: TEXT,
  transferDetails: TEXT,
  retention: TEXT,
});

/** An activity of the company's own, added on the register page: no catalogue item. */
export const processingActivityCreateSchema = processingActivityInsertSchema.omit({
  id: true,
  companyId: true,
  catalogId: true,
  createdAt: true,
  updatedAt: true,
});

export const processingActivityUpdateSchema = processingActivityCreateSchema.partial();

/**
 * What a describe screen of the GDPR walk writes on one activity: the Art. 30(1) facts, never the
 * name. An omitted fact keeps what is stored; an emptied text is stored as cleared.
 */
export const activityFactsSchema = processingActivityUpdateSchema.omit({ name: true });
