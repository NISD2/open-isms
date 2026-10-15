import { z } from "zod";
import czechRaw from "@/data/nis2-timeline-cs.json";
import { pickLocalized } from "@/lib/locale";
import type { TimelineEvent } from "./schema";

const CzechTimelineSchema = z.object({
  events: z.record(
    z.string(),
    z.object({ title: z.string().min(1), summary: z.string().min(1) }),
  ),
});

/** The Czech title and summary of each event, by its id; every fact stays in nis2-timeline.json. */
export const czechTimeline = CzechTimelineSchema.parse(czechRaw).events;

/** An event with its title and summary in the reader's language. */
export type TimelineView = Omit<TimelineEvent, "titleDe" | "summaryDe" | "addedAt">;

type EventText = Pick<TimelineEvent, "title" | "summary">;

const english = (event: TimelineEvent): EventText => ({
  title: event.title,
  summary: event.summary,
});

const TEXT_BY_LOCALE = {
  de: (event: TimelineEvent): EventText => ({
    title: event.titleDe,
    summary: event.summaryDe,
  }),
  en: english,
  /** English only for an event still missing its Czech text; the timeline test fails on one. */
  cs: (event: TimelineEvent): EventText => czechTimeline[event.id] ?? english(event),
};

/** The events in the reader's language: German, Czech, and English for every other locale. */
export const localizeTimeline = (
  events: readonly TimelineEvent[],
  locale: string,
): TimelineView[] => {
  const textOf = pickLocalized(TEXT_BY_LOCALE, locale);
  return events.map((event) => ({
    id: event.id,
    date: event.date,
    category: event.category,
    tags: event.tags,
    type: event.type,
    sourceId: event.sourceId,
    sourceUrl: event.sourceUrl,
    ...textOf(event),
  }));
};
