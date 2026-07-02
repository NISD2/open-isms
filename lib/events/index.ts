import { readFileSync } from "fs";
import { join } from "path";
import { eventsDataSchema } from "./schema";
import type { EventsData } from "./schema";

export function getEventsData(): EventsData {
  const filePath = join(process.cwd(), "data", "nis2-events.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return eventsDataSchema.parse(raw);
}

export {
  eventTopic,
  eventFormat,
  eventCost,
  eventSchema,
  eventsDataSchema,
} from "./schema";

export type {
  EventTopic,
  EventFormat,
  EventItem,
  EventsData,
} from "./schema";
