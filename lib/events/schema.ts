import { z } from "zod";

export const eventTopic = z.enum(["NIS2", "GDPR", "CRA"]);

export const eventFormat = z.enum(["online", "in-person", "hybrid"]);

// Free and open only: the events feed deliberately tracks no paid or
// commercial events, so cost is a single-value enum that enforces the rule.
export const eventCost = z.enum(["free"]);

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  topics: z.array(eventTopic).min(1),
  startDate: z.string(),
  endDate: z.string().nullable(),
  format: eventFormat,
  city: z.string(),
  country: z.string(),
  organizer: z.string(),
  infoUrl: z.string(),
  signupUrl: z.string().nullable(),
  cost: eventCost,
  language: z.string(),
  notes: z.string(),
});

export const eventsDataSchema = z.object({
  events: z.array(eventSchema),
  lastUpdated: z.string(),
});

export type EventTopic = z.infer<typeof eventTopic>;
export type EventFormat = z.infer<typeof eventFormat>;
export type EventItem = z.infer<typeof eventSchema>;
export type EventsData = z.infer<typeof eventsDataSchema>;
