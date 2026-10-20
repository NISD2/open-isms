import { describe, expect, test } from "bun:test";
import { fitPage, type PageCursor } from "./page";

const entry = (n: number, size = 10) => ({
  n,
  size,
  cursor: { at: `2026-10-20T10:00:00.${String(n).padStart(6, "0")}`, id: `id-${n}` },
});
const total = (kept: readonly { size: number }[]) =>
  kept.reduce((sum, e) => sum + e.size, 0);
const FALLBACK: PageCursor = { at: "fallback", id: "fallback" };

describe("a page that fits the answer", () => {
  test("keeps every entry and the cursor it was asked with when all fit", () => {
    const entries = [entry(1), entry(2), entry(3)];
    const page = fitPage(entries, (kept) => total(kept) <= 100, FALLBACK);
    expect(page.kept).toEqual(entries);
    expect(page.nextCursor).toBe(FALLBACK);
  });

  test("keeps the last page's end: no cursor stays no cursor", () => {
    expect(fitPage([entry(1)], () => true, null).nextCursor).toBeNull();
    expect(fitPage([], () => false, null)).toEqual({ kept: [], nextCursor: null });
  });

  test("cuts in the middle and reads on from the last entry kept, so none is skipped", () => {
    const entries = Array.from({ length: 10 }, (_, i) => entry(i + 1));
    const page = fitPage(entries, (kept) => total(kept) <= 45, FALLBACK);
    expect(page.kept.map((e) => e.n)).toEqual([1, 2, 3, 4]);
    expect(page.nextCursor).toEqual(entries[3]?.cursor);
  });

  test("finds the cut wherever it falls, for every size of page", () => {
    for (const length of [2, 3, 7, 50]) {
      for (let room = 10; room <= length * 10; room += 10) {
        const entries = Array.from({ length }, (_, i) => entry(i + 1));
        const page = fitPage(entries, (kept) => total(kept) <= room, FALLBACK);
        expect(page.kept.length).toBe(Math.min(length, room / 10));
      }
    }
  });

  test("returns a single entry too big for the answer alone, with its cursor", () => {
    const entries = [entry(1, 500), entry(2, 5), entry(3, 5)];
    const page = fitPage(entries, (kept) => total(kept) <= 100, FALLBACK);
    expect(page.kept.map((e) => e.n)).toEqual([1]);
    expect(page.nextCursor).toEqual(entries[0]?.cursor);
  });

  test("an oversized only entry is kept and the page ends there as asked", () => {
    const page = fitPage([entry(1, 500)], (kept) => total(kept) <= 100, null);
    expect(page.kept.map((e) => e.n)).toEqual([1]);
    expect(page.nextCursor).toBeNull();
  });
});
