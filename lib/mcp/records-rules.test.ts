/**
 * Who an assistant may read the company's records for, and how much one answer holds. The
 * plan gate (`notInPlan`) and the wiring are the e2e's (e2e/l3/mcp-read-records.spec.ts).
 */
import { describe, expect, test } from "bun:test";
import { WALK_LOCALES } from "@/lib/durchgang/types";
import { EXPORT_PART_NAMES } from "@/lib/export/company-export";
import { PAGE_ROWS, pageSizeOf, readRefusal } from "./records-rules";

const LINK = "https://example.test/de/export";
const ALLOW = { kind: "allow" } as const;
const CONFIRM = { kind: "confirm", lastDay: "20.11.2026" } as const;

describe("who an assistant may read the records for", () => {
  test("whoever may export reads, once the money back is no question", () => {
    for (const language of WALK_LOCALES) {
      expect(readRefusal(true, ALLOW, language, LINK)).toBeNull();
    }
  });

  test("whoever may not export reads nothing, in every language", () => {
    for (const language of WALK_LOCALES) {
      expect(readRefusal(false, ALLOW, language, LINK)).toContain("get_walkthrough");
    }
  });

  test("inside the money back the person confirms on the export page first", () => {
    for (const language of WALK_LOCALES) {
      const refusal = readRefusal(true, CONFIRM, language, LINK);
      expect(refusal).toContain("20.11.2026");
      expect(refusal).toContain(LINK);
      expect(refusal).toContain("B7");
    }
  });

  test("someone who may not export learns nothing about the company's money back", () => {
    const refusal = readRefusal(false, CONFIRM, "en", LINK);
    expect(refusal).not.toContain("20.11.2026");
    expect(refusal).not.toContain(LINK);
  });
});

describe("how much one answer holds", () => {
  test("a register page holds 50 rows; a document, being a whole policy, one", () => {
    expect(PAGE_ROWS).toBe(50);
    expect(pageSizeOf("documents")).toBe(1);
    for (const part of EXPORT_PART_NAMES.filter((p) => p !== "documents")) {
      expect(pageSizeOf(part)).toBe(PAGE_ROWS);
    }
  });
});
