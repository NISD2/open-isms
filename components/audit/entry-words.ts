import { failedCallCode } from "@nisd2/isms-trpc/audit/failed-call";

/** What one activity log entry says: its line, a second line if any, and whether the call failed. */
export type EntryWords = {
  readonly title: string;
  readonly detail: string | null;
  readonly failed: boolean;
};

/**
 * The words for one entry. `label` is the action's translated name, null when it has none. A
 * failed call's stored description is the procedure path and an English error code, which says
 * nothing to the reader, so it shows the label (or the action) with the failed marker instead.
 */
export function entryWords(
  row: { readonly action: string; readonly description: string },
  label: string | null,
): EntryWords {
  if (failedCallCode(row.action, row.description) !== null) {
    return { title: label ?? row.action, detail: null, failed: true };
  }
  // A stored description says something only when it is a sentence, not the action's own name.
  const sentence = row.description !== row.action && row.description.includes(" ");
  if (label !== null)
    return { title: label, detail: sentence ? row.description : null, failed: false };
  return { title: sentence ? row.description : row.action, detail: null, failed: false };
}
