import { z } from "zod";
import { UNPRINTABLE } from "@/lib/mcp/agent";

/** The pieces the tools' input schemas are made of. */

export const Day = z.iso.date();
export const Id = z.uuid();
export const Limit = (max: number, fallback: number) =>
  z.number().int().min(1).max(max).default(fallback);

/** Free text a caller sends: no control, format or bidi characters, which no real filter holds. */
export const Plain = (max: number, min = 0) =>
  z
    .string()
    .min(min)
    .max(max)
    .refine((s) => !UNPRINTABLE.test(s), "No control characters.");

/** What `nextCursor` looks like: the last row's microsecond time and id. */
export const CURSOR = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{1,6}\|[0-9a-f-]{36}$/i;

/** Days compare as text because they are YYYY-MM-DD; a missing end leaves the range open. */
export const daysInOrder = (range: {
  readonly fromDay?: string;
  readonly toDay?: string;
}): boolean => !range.fromDay || !range.toDay || range.fromDay <= range.toDay;

/** What a failed refine reports: the message, and the field it points at. */
interface RefineIssue {
  message: string;
  path: PropertyKey[];
}

export const DAYS_IN_ORDER: RefineIssue = {
  message: "fromDay must not be after toDay.",
  path: ["toDay"],
};

/** The idle window of the stalled-companies tool: at least a day wide. */
export const idleInOrder = (idle: {
  readonly minIdleDays: number;
  readonly maxIdleDays: number;
}): boolean => idle.minIdleDays < idle.maxIdleDays;

export const IDLE_IN_ORDER: RefineIssue = {
  message: "minIdleDays must be smaller than maxIdleDays.",
  path: ["maxIdleDays"],
};
