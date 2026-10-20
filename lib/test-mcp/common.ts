import "@/lib/server-guard";
import { like, or, type SQL, sql } from "drizzle-orm";
import { auditLog } from "@/schema";
import { WALK_ACTION_PREFIXES } from "./people";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** As the bare UTC timestamps of the audit log compare: an ISO string cast, never a local Date. */
export const utcDaysAgo = (days: number): string =>
  new Date(Date.now() - days * DAY_MS).toISOString();

/** A bare UTC timestamp (or an aggregate of one) as ISO text with a Z, as every other time is. */
export const isoZ = (timestamp: SQL) =>
  sql<string>`to_char(${timestamp}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

/** An action that moves the walkthrough or its requirements: what "got as far as" is read from. */
export const isWalkAction = or(
  ...WALK_ACTION_PREFIXES.map((prefix) => like(auditLog.action, `${prefix}%`)),
);
