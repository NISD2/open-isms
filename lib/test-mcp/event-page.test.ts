import { describe, expect, test } from "bun:test";
import type { auditLogFor } from "@/lib/platform-admin/users";
import { eventPage } from "./event-page";
import { MAX_CHARS, serialize, text } from "./guard";

type Log = Awaited<ReturnType<typeof auditLogFor>>;
type Row = Log["rows"][number];

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** A log row with stored values long enough that a default page cannot fit the answer. */
const row = (n: number): Row => ({
  id: id(n),
  at: new Date(Date.UTC(2026, 9, 20, 12, 0, 0, 1_000 - n)),
  action: "durchgang.recordAgreements",
  entityType: "requirement",
  entityId: id(n),
  description: `row ${n} for anna.muster@example.org from 203.0.113.7`,
  previousValue: { before: "b".repeat(300) },
  newValue: { text: "a".repeat(1_600) },
  userId: id(900),
  userEmail: "ops@example.org",
  companyId: id(901),
  companyName: "Muster GmbH",
  assistant: null,
  cursor: {
    at: `2026-10-20T12:00:00.${String(1_000_000 - n).padStart(6, "0")}`,
    id: id(n),
  },
});

/** The database's side of paging: rows after a cursor, a page of `limit` of them. */
function database(total: number) {
  const all = Array.from({ length: total }, (_, i) => row(i + 1));
  return (after: string | null, limit: number): Log => {
    const start =
      after === null
        ? 0
        : all.findIndex((r) => `${r.cursor.at}|${r.cursor.id}` === after) + 1;
    const rows = all.slice(start, start + limit);
    const last = rows.at(-1);
    return {
      rows,
      nextCursor: last && rows.length === limit ? last.cursor : null,
    };
  };
}

describe("a page of the event log", () => {
  test("holds fewer entries than were read when they do not fit, and says where to read on", () => {
    const page = eventPage(database(300)(null, 100), true);
    expect(page.entries.length).toBeLessThan(100);
    expect(page.entries.length).toBeGreaterThan(0);
    const last = page.entries.at(-1);
    expect(page.nextCursor).toBe(
      `2026-10-20T12:00:00.${String(1_000_000 - page.entries.length).padStart(6, "0")}|${id(page.entries.length)}`,
    );
    expect(last?.id).toBe(id(page.entries.length));
  });

  test("never reaches the cut of the answer, so the answer is whole", () => {
    const page = eventPage(database(300)(null, 300), true);
    const answer = text(page).content[0]?.text ?? "";
    expect(answer).not.toContain("…cut at");
    expect(serialize(page).length).toBeLessThanOrEqual(MAX_CHARS);
  });

  test("reading on from each cursor in turn returns every row once, none skipped", () => {
    const read = database(300);
    const seen: string[] = [];
    let cursor: string | null = null;
    // A page asked for 100 rows and given fewer; the loop must still reach the end.
    for (let pages = 0; pages < 200; pages += 1) {
      const page = eventPage(read(cursor, 100), true);
      seen.push(...page.entries.map((e) => e.id));
      if (page.nextCursor === null) break;
      cursor = page.nextCursor;
    }
    expect(seen).toEqual(Array.from({ length: 300 }, (_, i) => id(i + 1)));
  });

  test("masks addresses in descriptions and shows long stored values as previews", () => {
    const page = eventPage(database(3)(null, 100), true);
    const first = page.entries[0];
    expect(first?.description).toBe("row 1 for a***@example.org from [ip]");
    expect(first?.saved).toMatchObject({ cut: true });
    expect(first?.before).toEqual({ before: "b".repeat(300) });
  });

  test("leaves the stored values out unless they are asked for", () => {
    const first = eventPage(database(3)(null, 100), false).entries[0];
    expect(first).not.toHaveProperty("before");
    expect(first).not.toHaveProperty("saved");
  });
});
