/**
 * What read_records tells the assistant: why it reads nothing, in its language, and a page with
 * the way to the next. Who may read is the procedure's (server/trpc/routers/records.test.ts).
 */
import { describe, expect, test } from "bun:test";
import { WALK_LOCALES, type WalkLocale } from "@/lib/durchgang/types";
import { confirmFirst, notAllowed, notExporter, toolAnswer } from "./records-rules";

const LINK = "https://example.test/de/export";

describe("why an assistant reads nothing", () => {
  test("someone who may not export: who may, and what the assistant can do instead", () => {
    for (const language of WALK_LOCALES) {
      expect(notExporter(language)).toContain("get_walkthrough");
    }
  });

  test("inside the money back: the export page, where the person confirms, never the assistant", () => {
    for (const language of WALK_LOCALES) {
      const refusal = confirmFirst(language, LINK);
      expect(refusal).toContain(LINK);
      expect(refusal).toContain("B7");
    }
  });

  test("the admin has not let assistants read: Settings, where an admin turns it on", () => {
    const settings = "https://example.test/de/einstellungen";
    for (const language of WALK_LOCALES) {
      expect(notAllowed(language, settings)).toEndWith(settings);
    }
  });

  test("each language says it in its own words", () => {
    for (const say of [
      notExporter,
      (language: WalkLocale) => notAllowed(language, LINK),
      (language: WalkLocale) => confirmFirst(language, LINK),
    ]) {
      expect(new Set(WALK_LOCALES.map(say)).size).toBe(WALK_LOCALES.length);
    }
  });
});

describe("what the assistant gets back", () => {
  test("a page with more after it names the next page", () => {
    expect(toolAnswer("kpis", 2, { kind: "rows", rows: [{ n: 1 }], more: true })).toEqual(
      {
        ok: true,
        data: {
          part: "kpis",
          page: 2,
          rows: [{ n: 1 }],
          more: true,
          next: 'More rows follow: call read_records with part "kpis" and page 3.',
        },
      },
    );
  });

  test("the last page says nothing follows", () => {
    expect(toolAnswer("kpis", 1, { kind: "rows", rows: [], more: false })).toMatchObject({
      ok: true,
      data: { more: false, next: null },
    });
  });

  test("a one-record part comes back as the record", () => {
    expect(toolAnswer("company", 1, { kind: "record", record: { name: "X" } })).toEqual({
      ok: true,
      data: { part: "company", record: { name: "X" } },
    });
  });
});
