import { z } from "zod";
import type { AnyScreen } from "@/lib/durchgang/types";

/**
 * What one fill_walkthrough_item call saved on an item, kept as the `new_value` of its audit row
 * (action `mcp.item_filled`, entity the item's requirement). The procedures' own audit rows record
 * each write but not which item a register row was for; this row is what lets the walkthrough
 * mark the screens an assistant wrote.
 */
export const ITEM_FILLED = "mcp.item_filled";

export const FillRecord = z.object({
  code: z.string(),
  /** The fields answered. */
  answers: z.array(z.string()),
  /** The screens saved through their own procedure. */
  screens: z.array(z.string()),
  /** Whether a register row was added or corrected. */
  register: z.boolean(),
  /** How many uploaded files were attached as evidence. */
  files: z.number().int().nonnegative(),
});
export type FillRecord = z.infer<typeof FillRecord>;

/** One fill as the walkthrough reads it back: by which assistant, when, and what it saved. */
export interface AssistantFill {
  readonly client: string;
  readonly at: Date;
  readonly record: FillRecord;
}

/** On a screen of the walkthrough: the assistant that last wrote it, and when. */
export interface AssistantMark {
  readonly client: string;
  readonly at: Date;
}

/** Whether this fill wrote what the screen shows. */
export function wroteScreen(screen: AnyScreen, record: FillRecord): boolean {
  switch (screen.kind) {
    case "fields":
      return screen.fields.some((key) => record.answers.includes(key));
    case "evidence":
      return (
        record.files > 0 ||
        (screen.field !== null && record.answers.includes(screen.field))
      );
    case "register":
      return record.register;
    default:
      return record.screens.includes(screen.kind);
  }
}

/**
 * Per screen, in the order given, the newest fill that wrote it, or null where no assistant did.
 * `fills` come newest first.
 */
export const assistantMarks = (
  screens: readonly AnyScreen[],
  fills: readonly AssistantFill[],
): ReadonlyArray<AssistantMark | null> =>
  screens.map((screen) => {
    const fill = fills.find((f) => wroteScreen(screen, f.record));
    return fill ? { client: fill.client, at: fill.at } : null;
  });
