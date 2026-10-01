import { describe, expect, test } from "bun:test";
import { berlinHour } from "./berlin-calendar";

describe("the Berlin hour the daily deadline run starts by", () => {
  test("06:00 Berlin in winter is 05:00 UTC", () => {
    expect(berlinHour(new Date("2026-01-20T05:00:00Z"))).toBe(6);
  });

  test("06:00 Berlin in summer is 04:00 UTC", () => {
    expect(berlinHour(new Date("2026-07-14T04:00:00Z"))).toBe(6);
  });

  test("the morning after the clocks go back is on winter time", () => {
    expect(berlinHour(new Date("2026-10-25T05:00:00Z"))).toBe(6);
  });

  test("midnight reads as hour 0, not 24", () => {
    expect(berlinHour(new Date("2026-01-20T23:00:00Z"))).toBe(0);
  });
});
