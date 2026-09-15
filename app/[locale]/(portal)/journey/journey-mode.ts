import type { journeyModeEnum } from "@/schema";

/**
 * Journey layout mode, derived from the DB enum so the column stays the single
 * source of truth. Type-only import: nothing from the schema reaches the
 * client bundle.
 */
export type JourneyMode = (typeof journeyModeEnum)["enumValues"][number];
