import { describe, expect, test } from "bun:test";
import { billingEnvShape } from "./config-schema";
import { isActivePromo, PROMO_ENDED, promoState, promoSummary } from "./promo";

const settings = {
  GRANDFATHER_PROMO_CODE: "2400",
  GRANDFATHER_PROMO_UNTIL: "2026-11-05",
};

describe("promoState", () => {
  test("the configured code up to and including its last day in Berlin", () => {
    // 23:30 on 05.11 in Berlin is still the last day.
    expect(promoState("2400", settings, new Date("2026-11-05T22:30:00Z"))).toEqual({
      state: "active",
      until: "2026-11-05",
    });
  });

  test("after the last day the link reads as ended, so the page can say so", () => {
    // 00:30 on 06.11 in Berlin is past it, though UTC still says 05.11.
    expect(promoState("2400", settings, new Date("2026-11-05T23:30:00Z"))).toEqual({
      state: "expired",
      until: "2026-11-05",
    });
    expect(isActivePromo("2400", settings, new Date("2026-11-06T09:00:00Z"))).toBe(false);
  });

  test("anything but the exact code is nothing", () => {
    const now = new Date("2026-10-01T09:00:00Z");
    expect(promoState("2400 ", settings, now)).toEqual({ state: "none" });
    expect(promoState("24000", settings, now)).toEqual({ state: "none" });
    expect(promoState(null, settings, now)).toEqual({ state: "none" });
  });

  test("a code without a last day does nothing, so it can never stay open for good", () => {
    const now = new Date("2026-10-01T09:00:00Z");
    expect(promoState("2400", { GRANDFATHER_PROMO_CODE: "2400" }, now)).toEqual({
      state: "none",
    });
    expect(promoState("2400", {}, now)).toEqual({ state: "none" });
  });
});

describe("promoSummary", () => {
  test("counts calendar days in Berlin to the last day", () => {
    expect(promoSummary(settings, new Date("2026-10-29T09:00:00Z"))).toEqual({
      configured: true,
      code: "2400",
      until: "2026-11-05",
      state: "active",
      daysLeft: 7,
    });
    expect(promoSummary(settings, new Date("2026-11-05T09:00:00Z"))).toMatchObject({
      state: "active",
      daysLeft: 0,
    });
    expect(promoSummary(settings, new Date("2026-11-07T09:00:00Z"))).toMatchObject({
      state: "expired",
      daysLeft: -2,
    });
  });

  test("names what is missing when the promo cannot run", () => {
    expect(promoSummary({})).toEqual({ configured: false, missing: "code" });
    expect(promoSummary({ GRANDFATHER_PROMO_CODE: "2400" })).toEqual({
      configured: false,
      missing: "last day",
    });
  });
});

describe("GRANDFATHER_PROMO_UNTIL", () => {
  const parse = (raw: string | undefined) =>
    billingEnvShape.GRANDFATHER_PROMO_UNTIL.parse(raw);

  test("keeps a date, treats blank as unset", () => {
    expect(parse(" 2026-11-05 ")).toBe("2026-11-05");
    expect(parse("")).toBeUndefined();
    expect(parse(undefined)).toBeUndefined();
  });

  test("a value that is not a date closes the promo instead of leaving it open", () => {
    expect(parse("05.11.2026")).toBe(PROMO_ENDED);
    expect(
      isActivePromo("2400", {
        GRANDFATHER_PROMO_CODE: "2400",
        GRANDFATHER_PROMO_UNTIL: PROMO_ENDED,
      }),
    ).toBe(false);
  });
});
