import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isLabelledSegment, SEGMENT_LABELS } from "./segment-labels";

const portalMessages = (locale: string) =>
  JSON.parse(
    readFileSync(join(import.meta.dir, `../../messages/portal/${locale}.json`), "utf8"),
  ).portal;

describe("SEGMENT_LABELS", () => {
  // English is the fallback every other locale is filled from (i18n/request.ts), so a key there
  // resolves in every locale; German is the primary language.
  test.each(["en", "de"])("every label is a portal message in %s", (locale) => {
    const portal = portalMessages(locale);
    for (const key of Object.values(SEGMENT_LABELS)) {
      expect(typeof portal[key]).toBe("string");
    }
  });

  test("a segment is labelled only by its own entry, never by an inherited key", () => {
    expect(isLabelledSegment("risks")).toBe(true);
    expect(isLabelledSegment("bestellen")).toBe(false);
    expect(isLabelledSegment("toString")).toBe(false);
  });
});
