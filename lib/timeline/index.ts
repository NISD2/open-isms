import { readFileSync } from "fs";
import { join } from "path";
import { timelineDataSchema } from "./schema";
import type { TimelineData } from "./schema";

export function getTimelineData(): TimelineData {
  const filePath = join(process.cwd(), "data", "nis2-timeline.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return timelineDataSchema.parse(raw);
}

export {
  timelineCategory,
  timelineTag,
  timelineEventType,
  timelineDataSchema,
  timelineSourceSchema,
  timelineEventSchema,
} from "./schema";

export type {
  TimelineData,
  TimelineCategory,
  TimelineTag,
  TimelineEventType,
  TimelineSource,
  TimelineEvent,
} from "./schema";
