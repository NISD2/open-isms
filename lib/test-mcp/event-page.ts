import type { auditLogFor } from "@/lib/platform-admin/users";
import { MAX_CHARS, serialize } from "./guard";
import { fitPage } from "./page";
import { shownDescription, shownValue } from "./sanitize";

type Log = Awaited<ReturnType<typeof auditLogFor>>;

/** As long as a real cursor, so the room it takes in the answer is counted when fitting a page. */
const CURSOR_ROOM = "x".repeat(70);

/**
 * One page of the event log as the tool answers it: every description masked and bounded, the
 * stored values (when asked for) masked and bounded, and as many whole entries as fit
 * MAX_CHARS. The cursor reads on from the last entry shown, so a page that had to be shortened
 * loses no row: the next page starts right after the last one this page holds.
 */
export function eventPage(log: Log, includeValues: boolean) {
  const shown = log.rows.map(
    ({ previousValue, newValue, description, cursor, named, ...row }) => ({
      cursor,
      entry: {
        ...row,
        description: shownDescription(description),
        // The ids in the values are only worth a name where the values are shown.
        ...(includeValues
          ? { before: shownValue(previousValue), saved: shownValue(newValue), named }
          : {}),
      },
    }),
  );
  const page = fitPage(
    shown,
    (kept) =>
      serialize({ nextCursor: CURSOR_ROOM, entries: kept.map((k) => k.entry) }).length <=
      MAX_CHARS,
    log.nextCursor,
  );
  return {
    nextCursor: page.nextCursor ? `${page.nextCursor.at}|${page.nextCursor.id}` : null,
    entries: page.kept.map((k) => k.entry),
  };
}
