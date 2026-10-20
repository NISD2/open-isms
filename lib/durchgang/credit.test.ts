import { describe, expect, test } from "bun:test";
import { alsoCountsFor } from "./credit";
import { WALKS } from "./index";

describe("what a signature in one walk counts for in the other", () => {
  test("nothing today: every NIS 2 to GDPR link is an overlap, never the same record", () => {
    // Pinned so the approval pages' "approves nothing for the other law" stays true; an
    // `equivalent` link added later shows as a badge on both pages by itself.
    for (const walk of Object.values(WALKS)) {
      for (const item of walk.items) expect(alsoCountsFor(item.code)).toEqual([]);
    }
  });
});
