import { describe, expect, test } from "bun:test";
import { berlinDay, berlinHour } from "./berlin-calendar";

describe("the Berlin calendar the daily deadline run keeps", () => {
  test("late evening UTC is already the next day in Berlin (summer, UTC+2)", () => {
    const at = new Date("2026-07-14T22:30:00Z");
    expect(berlinDay(at)).toBe("2026-07-15");
    expect(berlinHour(at)).toBe(0);
  });

  test("06:00 Berlin in winter is 05:00 UTC", () => {
    const at = new Date("2026-01-20T05:00:00Z");
    expect(berlinDay(at)).toBe("2026-01-20");
    expect(berlinHour(at)).toBe(6);
  });

  test("the night the clocks go back keeps one calendar day", () => {
    expect(berlinDay(new Date("2026-10-25T00:30:00Z"))).toBe("2026-10-25");
    expect(berlinDay(new Date("2026-10-25T21:30:00Z"))).toBe("2026-10-25");
  });

  test("midnight reads as hour 0, not 24", () => {
    expect(berlinHour(new Date("2026-01-20T23:00:00Z"))).toBe(0);
  });
});
