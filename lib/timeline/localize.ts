import { z } from "zod";
import czechRaw from "@/data/nis2-timeline-cs.json";
import { pickLocalized } from "@/lib/locale";
import type { TimelineId } from "./index";
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
type CzechTexts = Readonly<Record<string, EventText>>;

/** Only the NIS2 timeline is translated into Czech; the CRA and AI Act timelines read English there. */
export const czechTextsOf = (id: TimelineId): CzechTexts =>
  id === "nis2" ? czechTimeline : {};

const english = (event: TimelineEvent): EventText => ({
  title: event.title,
  summary: event.summary,
});

const textByLocale = (czech: CzechTexts) => ({
  de: (event: TimelineEvent): EventText => ({
    title: event.titleDe,
    summary: event.summaryDe,
  }),
  en: english,
  /** English for an event without Czech text; the NIS2 timeline test fails on one. */
  cs: (event: TimelineEvent): EventText => czech[event.id] ?? english(event),
});

/** The events in the reader's language: German, Czech, and English for every other locale. */
export const localizeTimeline = (
  events: readonly TimelineEvent[],
  locale: string,
  czech: CzechTexts = {},
): TimelineView[] => {
  const textOf = pickLocalized(textByLocale(czech), locale);
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
