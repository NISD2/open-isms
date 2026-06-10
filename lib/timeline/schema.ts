import { z } from "zod";

export const timelineCategory = z.enum([
  "eu",
  "de",
  "cir",
  "grundschutz",
  "enisa",
  "market",
  // Country-level transposition milestones (other than DE, which keeps
  // the dedicated "de" category for historical reasons).
  "national-transposition",
]);

export const timelineTag = z.enum([
  "legislation",
  "enforcement",
  "guidance",
  "deadline",
  "registration",
  "incident-reporting",
  "amendment",
  "transposition",
  "certification",
  "penalty",
  "supply-chain",
  "post-quantum",
  "kritis",
  "publication",
  "market",
  // Lifecycle tags for transposition events.
  "in-force",
  "infringement",
  "organisational",
  // ISO 3166-1 alpha-2 country codes (lowercase) — used as tags on
  // national-transposition events so the UI can drill down per Member State.
  "at", "be", "bg", "cy", "cz", "de", "dk", "ee", "es", "fi", "fr",
  "gr", "hr", "hu", "ie", "it", "lt", "lu", "lv", "mt", "nl", "pl",
  "pt", "ro", "se", "si", "sk",
]);

export const timelineEventType = z.enum(["milestone", "update"]);

export const timelineSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  description: z.string(),
  language: z.enum(["en", "de", "both"]),
});

export const timelineEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  category: timelineCategory,
  tags: z.array(timelineTag).min(1),
  type: timelineEventType,
  title: z.string(),
  titleDe: z.string(),
  summary: z.string(),
  summaryDe: z.string(),
  sourceId: z.string(),
  sourceUrl: z.string(),
  addedAt: z.string(),
});

export const timelineDataSchema = z.object({
  sources: z.array(timelineSourceSchema),
  events: z.array(timelineEventSchema),
  lastUpdated: z.string(),
});

export type TimelineCategory = z.infer<typeof timelineCategory>;
export type TimelineTag = z.infer<typeof timelineTag>;
export type TimelineEventType = z.infer<typeof timelineEventType>;
export type TimelineSource = z.infer<typeof timelineSourceSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type TimelineData = z.infer<typeof timelineDataSchema>;
