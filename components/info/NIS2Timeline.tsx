import { getLocale } from "next-intl/server";
import { localizeTimeline } from "@/lib/timeline/localize";
import type { TimelineEvent, TimelineSource } from "@/lib/timeline/schema";
import { NIS2TimelineList } from "./NIS2TimelineList";

interface NIS2TimelineProps {
  events: TimelineEvent[];
  sources: TimelineSource[];
  lastUpdated: string;
}

/**
 * The timeline in the reader's language. The events are put in that language here, on the
 * server, so the page ships one language's titles and summaries instead of every language's.
 */
export async function NIS2Timeline({ events, sources, lastUpdated }: NIS2TimelineProps) {
  const locale = await getLocale();
  return (
    <NIS2TimelineList
      events={localizeTimeline(events, locale)}
      sources={sources}
      lastUpdated={lastUpdated}
    />
  );
}
