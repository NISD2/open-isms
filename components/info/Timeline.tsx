import { getLocale } from "next-intl/server";
import { getTimelineData, type TimelineId } from "@/lib/timeline";
import { czechTextsOf, localizeTimeline } from "@/lib/timeline/localize";
import { TimelineList } from "./TimelineList";

/** Event dates are calendar days; what is still ahead is judged by today's day in Berlin. */
const berlinDay = (date: Date): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(date);

/**
 * One regulation's timeline in the reader's language. The events are put in that language here,
 * on the server, so the page ships one language's titles and summaries instead of every language's.
 */
export async function Timeline({ id }: { id: TimelineId }) {
  const locale = await getLocale();
  const { events, sources, lastUpdated } = getTimelineData(id);
  return (
    <TimelineList
      events={localizeTimeline(events, locale, czechTextsOf(id))}
      sources={sources}
      lastUpdated={lastUpdated}
      today={berlinDay(new Date())}
    />
  );
}
