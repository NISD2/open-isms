import { readFileSync } from "fs";
import { join } from "path";
import type { TimelineData } from "./schema";
import { timelineDataSchema } from "./schema";

/** One data file per regulation; each is read with the same schema. */
const TIMELINE_FILES = {
  nis2: "nis2-timeline.json",
  cra: "cra-timeline.json",
  "ai-act": "ai-act-timeline.json",
} as const;

export type TimelineId = keyof typeof TIMELINE_FILES;

export const TIMELINE_IDS = Object.keys(TIMELINE_FILES) as TimelineId[];

export function getTimelineData(id: TimelineId): TimelineData {
  const filePath = join(process.cwd(), "data", TIMELINE_FILES[id]);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return timelineDataSchema.parse(raw);
}

export type {
  TimelineCategory,
  TimelineData,
  TimelineEvent,
  TimelineEventType,
  TimelineSource,
  TimelineTag,
} from "./schema";
export {
  timelineCategory,
  timelineDataSchema,
  timelineEventSchema,
  timelineEventType,
  timelineSourceSchema,
  timelineTag,
} from "./schema";
