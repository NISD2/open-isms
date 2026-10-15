import { getLocale } from "next-intl/server";
import { localizeEvents } from "@/lib/events/localize";
import type { EventItem } from "@/lib/events/schema";
import { NIS2EventsList } from "./NIS2EventsList";

interface NIS2EventsProps {
  events: EventItem[];
  lastUpdated: string;
}

/** The events feed in the reader's language, its notes put in that language on the server. */
export async function NIS2Events({ events, lastUpdated }: NIS2EventsProps) {
  const locale = await getLocale();
  return (
    <NIS2EventsList events={localizeEvents(events, locale)} lastUpdated={lastUpdated} />
  );
}
