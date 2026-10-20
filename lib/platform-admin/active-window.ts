/**
 * How far back "active" looks. No imports, so the browser panel, the tRPC procedure and the test
 * endpoint all read the same numbers from here.
 */
export const DEFAULT_ACTIVE_DAYS = 14;
export const MAX_ACTIVE_DAYS = 365;
/** The buttons next to the days field. */
export const QUICK_ACTIVE_DAYS = [7, 14, 30, 90] as const;

/**
 * What a days field holds, as a window the procedure accepts: a whole number from 1 to the most
 * it allows (a larger or smaller one is clamped, a decimal cut), or null for an empty or
 * non-numeric field, which leaves the window as it was.
 */
export function clampActiveDays(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(MAX_ACTIVE_DAYS, Math.max(1, Math.trunc(n)));
}
