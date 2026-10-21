/**
 * How a read of one part is paged: which rows a page asks for, whether another follows, and which
 * reads the input refuses before any query.
 */
import { describe, expect, test } from "bun:test";
import type { DbOrTx } from "@/lib/db";
import { EXPORT_PART_NAMES } from "./company-export";
import { PAGE_ROWS, pageSizeOf, ReadPartInput, readPart } from "./read-part";

const COMPANY = "33333333-3333-4333-8333-333333333333";

/** A database whose every list read answers `count` rows and keeps the page it asked for. */
function fakeDb(count: number) {
  const pages: Array<{ limit?: number; offset?: number }> = [];
  const query = new Proxy(
    {},
    {
      get: () => ({
        findMany: async (config: { limit?: number; offset?: number }) => {
          pages.push({ limit: config.limit, offset: config.offset });
          return Array.from({ length: count }, (_, i) => ({ n: i }));
        },
        findFirst: async () => ({ name: "Beispielwerke GmbH" }),
      }),
    },
  );
  return { db: { query } as unknown as DbOrTx, pages };
}

describe("a page of a register", () => {
  test("asks for one row more than a page, from where the page starts", async () => {
    const { db, pages } = fakeDb(0);
    await readPart(db, COMPANY, { part: "kpis", page: 3 });
    expect(pages).toEqual([{ limit: PAGE_ROWS + 1, offset: 2 * PAGE_ROWS }]);
  });

  test("a full page and one more row: the page, and another follows", async () => {
    const { db } = fakeDb(PAGE_ROWS + 1);
    const answer = await readPart(db, COMPANY, { part: "kpis", page: 1 });
    expect(answer.kind).toBe("rows");
    if (answer.kind !== "rows") return;
    expect(answer.rows).toHaveLength(PAGE_ROWS);
    expect(answer.more).toBe(true);
  });

  test("a page exactly full is the last one", async () => {
    const { db } = fakeDb(PAGE_ROWS);
    const answer = await readPart(db, COMPANY, { part: "kpis", page: 1 });
    expect(answer).toMatchObject({ kind: "rows", more: false });
  });

  test("past the last row, an empty page", async () => {
    const { db } = fakeDb(0);
    expect(await readPart(db, COMPANY, { part: "suppliers", page: 9 })).toEqual({
      kind: "rows",
      rows: [],
      more: false,
    });
  });

  test("a register page holds 50 rows; a document, being a whole policy, one", () => {
    expect(PAGE_ROWS).toBe(50);
    expect(pageSizeOf("documents")).toBe(1);
    for (const part of EXPORT_PART_NAMES.filter((p) => p !== "documents")) {
      expect(pageSizeOf(part)).toBe(PAGE_ROWS);
    }
  });
});

describe("a part that is one record", () => {
  test("comes back whole", async () => {
    const { db } = fakeDb(0);
    expect(await readPart(db, COMPANY, { part: "company", page: 1 })).toEqual({
      kind: "record",
      record: { name: "Beispielwerke GmbH" },
    });
  });
});

describe("what the input refuses before any query", () => {
  test("a second page of a part that is one record", () => {
    for (const part of ["company", "answers"] as const) {
      expect(ReadPartInput.safeParse({ part, page: 2 }).success).toBe(false);
      expect(ReadPartInput.safeParse({ part, page: 1 }).success).toBe(true);
    }
  });

  test("a part the export does not have, and pages that are no page", () => {
    expect(ReadPartInput.safeParse({ part: "user", page: 1 }).success).toBe(false);
    expect(ReadPartInput.safeParse({ part: "billingAccount" }).success).toBe(false);
    for (const page of [0, -1, 1.5, 100_001]) {
      expect(ReadPartInput.safeParse({ part: "kpis", page }).success).toBe(false);
    }
  });

  test("without a page, the first", () => {
    expect(ReadPartInput.parse({ part: "kpis" })).toEqual({ part: "kpis", page: 1 });
  });
});
