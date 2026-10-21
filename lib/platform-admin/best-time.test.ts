/**
 * "Good time to message or call" is read from days, not from actions, in Berlin time. Any sign of
 * life gives an answer, even a single sign-in; with little to go on it is marked as a guess.
 */
import { describe, expect, test } from "bun:test";
import { bestTimeToReach, formatWeekdays, formatWindow } from "./best-time";

const at = (iso: string) => new Date(iso);

describe("bestTimeToReach", () => {
  test("a single sign-in is still an hour worth showing, as a guess", () => {
    // 07:33 UTC on Wednesday 21.10.2026 is 09:33 in Berlin.
    const reach = bestTimeToReach([at("2026-10-21T07:33:07Z")]);
    if (reach.kind !== "known") throw new Error("expected known");
    expect(reach.windows.map(formatWindow)).toEqual(["09:00–11:00"]);
    expect(formatWeekdays(reach.weekdays)).toBe("Wed");
    expect(reach.activeDays).toBe(1);
    expect(reach.firm).toBe(false);
  });

  test("two days is still a guess", () => {
    const reach = bestTimeToReach([
      at("2026-10-20T07:00:00Z"),
      at("2026-10-21T07:00:00Z"),
    ]);
    if (reach.kind !== "known") throw new Error("expected known");
    expect(reach.windows.map(formatWindow)).toEqual(["09:00–11:00"]);
    expect(reach.windows[0]?.days).toBe(2);
    expect(reach.firm).toBe(false);
  });

  test("three days at three different hours is a guess, with the earliest busy hour first", () => {
    const reach = bestTimeToReach([
      at("2026-10-19T05:30:00Z"),
      at("2026-10-20T11:30:00Z"),
      at("2026-10-21T16:30:00Z"),
    ]);
    if (reach.kind !== "known") throw new Error("expected known");
    expect(reach.windows.map(formatWindow)).toEqual(["07:00–09:00"]);
    expect(reach.firm).toBe(false);
  });

  test("nothing at all is unknown", () => {
    expect(bestTimeToReach([])).toEqual({ kind: "unknown" });
  });

  test("reads the hour in Berlin time, summer and winter", () => {
    // 05:30 UTC is 07:30 in Berlin in summer; 06:30 UTC is 07:30 in winter.
    const summer = bestTimeToReach(
      ["2026-06-02", "2026-06-03", "2026-06-04"].map((d) => at(`${d}T05:30:00Z`)),
    );
    const winter = bestTimeToReach(
      ["2026-01-13", "2026-01-14", "2026-01-15"].map((d) => at(`${d}T06:30:00Z`)),
    );
    for (const reach of [summer, winter]) {
      expect(reach.kind).toBe("known");
      if (reach.kind === "known") {
        expect(reach.windows.map(formatWindow)).toEqual(["07:00–09:00"]);
        expect(reach.windows[0]?.days).toBe(3);
        expect(reach.firm).toBe(true);
      }
    }
  });

  test("a long sitting counts once, so it cannot outvote the mornings they return to", () => {
    const sitting = Array.from({ length: 60 }, (_, i) =>
      at(`2026-09-23T12:${String(i).padStart(2, "0")}:00Z`),
    );
    const mornings = ["2026-09-24", "2026-09-30", "2026-10-01"].map((d) =>
      at(`${d}T05:40:00Z`),
    );
    const reach = bestTimeToReach([...sitting, ...mornings]);
    expect(reach.kind).toBe("known");
    if (reach.kind === "known") {
      expect(reach.activeDays).toBe(4);
      // 05:40 UTC is 07:40 in Berlin; the afternoon sitting was one day only.
      expect(formatWindow(reach.windows[0] ?? { fromHour: 0, toHour: 0, days: 0 })).toBe(
        "07:00–09:00",
      );
      expect(reach.windows[0]?.days).toBe(3);
    }
  });

  test("a second window shows only when it is nearly as busy", () => {
    const morning = ["2026-09-24", "2026-09-30", "2026-10-01", "2026-10-02"].map((d) =>
      at(`${d}T05:40:00Z`),
    );
    const afternoon = ["2026-09-24", "2026-09-30"].map((d) => at(`${d}T12:20:00Z`));
    const both = bestTimeToReach([...morning, ...afternoon]);
    const once = bestTimeToReach([...morning, at("2026-09-24T12:20:00Z")]);
    if (both.kind !== "known" || once.kind !== "known") throw new Error("expected known");
    expect(both.windows.map(formatWindow)).toEqual(["07:00–09:00", "14:00–16:00"]);
    expect(once.windows.map(formatWindow)).toEqual(["07:00–09:00"]);
  });

  test("the last time they were seen is the latest instant given", () => {
    const reach = bestTimeToReach([
      at("2026-10-01T05:40:00Z"),
      at("2026-10-21T07:33:07Z"),
      at("2026-09-24T05:40:00Z"),
    ]);
    if (reach.kind !== "known") throw new Error("expected known");
    expect(reach.lastSeen.toISOString()).toBe("2026-10-21T07:33:07.000Z");
  });
});

describe("formatWeekdays", () => {
  test("a run is written once, from the first day to the last", () => {
    expect(formatWeekdays([2, 3, 4, 5])).toBe("Tue–Fri");
    expect(formatWeekdays([1, 2, 3, 4, 5])).toBe("Mon–Fri");
  });

  test("a gap starts a new run, and a single day stands alone", () => {
    expect(formatWeekdays([1, 2, 3, 5])).toBe("Mon–Wed, Fri");
    expect(formatWeekdays([3])).toBe("Wed");
    expect(formatWeekdays([1, 3, 7])).toBe("Mon, Wed, Sun");
  });
});
