import { z } from "zod";
import czechRaw from "@/data/nis2-events-cs.json";
import type { EventItem } from "./schema";

const CzechEventsSchema = z.object({
  events: z.record(z.string(), z.object({ notes: z.string() })),
});

/** The Czech notes of each event, by its id. Titles stay in the event's own language by design. */
export const czechEventNotes = CzechEventsSchema.parse(czechRaw).events;

/**
 * The events as the reader sees them: on a Czech page with Czech notes. Other pages keep the
 * notes as written, since only the Czech set is translated. A missing Czech note falls back to
 * the written one; the events test fails on it.
 */
export const localizeEvents = (
  events: readonly EventItem[],
  locale: string,
): EventItem[] =>
  locale === "cs"
    ? events.map((event) => ({
        ...event,
        notes: czechEventNotes[event.id]?.notes ?? event.notes,
      }))
    : [...events];
