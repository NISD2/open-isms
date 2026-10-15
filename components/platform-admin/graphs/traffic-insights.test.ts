/**
 * The traffic rules, pinned on a synthetic case shaped like the one that motivated them: visits
 * grow quickly while one country goes from a handful of visits to over a hundred and another sends
 * hundreds that all leave after one page, and a third carries the people who actually read.
 */
import { describe, expect, test } from "bun:test";
import type { CountryTraffic, TrafficPulse, WeekTraffic } from "@/lib/analytics/umami";
import type { UserFact } from "@/lib/platform-admin/growth";
import { allInsights, insightWeeks, weeklyInsights } from "./insights";
import {
  engagedVisits,
  engagedVisitsMoved,
  signupsPerVisitFalling,
  singlePageTraffic,
} from "./traffic-insights";

const TODAY = "2026-10-15";

const weeks = insightWeeks(TODAY);
const week = (index: number, visits: number, bounces: number): WeekTraffic => ({
  from: weeks[index]?.from ?? "",
  to: weeks[index]?.to ?? "",
  visits,
  bounces,
});

/** Four baseline weeks of 400 visits with 250 single-page ones: 150 engaged a week. */
const pulse = (overrides: Partial<TrafficPulse> = {}): TrafficPulse => ({
  thisWeek: week(0, 400, 250),
  baselineWeeks: [1, 2, 3, 4].map((i) => week(i, 400, 250)),
  countries: [],
  countriesBefore: [],
  ...overrides,
});

const country = (
  code: string,
  visits: number,
  bounces: number,
  count = visits,
): CountryTraffic => ({
  code,
  count,
  visits,
  bounces,
});

const user = (signupDay: string, overrides: Partial<UserFact> = {}): UserFact => ({
  signupDay,
  verified: true,
  disposable: false,
  locale: "de",
  fromPath: null,
  utmSource: null,
  utmCampaign: null,
  inOrg: true,
  activatedDay: null,
  activeDays: [],
  workEvents: 0,
  complianceEvents: 0,
  signOffs: 0,
  coursesStarted: [],
  coursesFinished: [],
  ...overrides,
});

describe("insightWeeks", () => {
  test("this week first, then four whole weeks before it, newest first", () => {
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual({ from: "2026-10-09", to: "2026-10-15" });
    expect(weeks[1]).toEqual({ from: "2026-10-02", to: "2026-10-08" });
    expect(weeks[4]).toEqual({ from: "2026-09-11", to: "2026-09-17" });
  });
});

describe("engagedVisits", () => {
  test("visits that did not leave after one page", () => {
    expect(engagedVisits({ visits: 686, bounces: 366 })).toBe(320);
  });
});

describe("engagedVisitsMoved", () => {
  test("quiet inside the band", () => {
    expect(engagedVisitsMoved(pulse({ thisWeek: week(0, 420, 250) }))).toBeNull();
  });

  test("a drop of a quarter or more is something to act on, and says automated traffic is excluded", () => {
    const found = engagedVisitsMoved(pulse({ thisWeek: week(0, 400, 300) }));
    expect(found?.id).toBe("engaged-visits-down");
    expect(found?.tone).toBe("act");
    expect(found?.detail).toContain("100 visits viewed more than one page");
    expect(found?.detail).toContain("down 33 percent");
  });

  test("a rise of a third or more is good news", () => {
    const found = engagedVisitsMoved(pulse({ thisWeek: week(0, 500, 290) }));
    expect(found?.id).toBe("engaged-visits-up");
    expect(found?.tone).toBe("good");
  });

  test("a small baseline is noise, not a trend", () => {
    const small = pulse({
      thisWeek: week(0, 40, 35),
      baselineWeeks: [1, 2, 3, 4].map((i) => week(i, 40, 10)),
    });
    expect(engagedVisitsMoved(small)).toBeNull();
  });

  test("a surge of single-page visits cannot read as growth", () => {
    expect(engagedVisitsMoved(pulse({ thisWeek: week(0, 1100, 950) }))).toBeNull();
  });
});

describe("singlePageTraffic", () => {
  test("names the countries whose visits almost all stay on one page, and says it is a surge", () => {
    const found = singlePageTraffic(
      pulse({
        thisWeek: week(0, 1000, 600),
        countries: [
          country("DE", 343, 183),
          country("SG", 278, 278),
          country("PL", 113, 110),
        ],
        countriesBefore: [
          { code: "DE", count: 1200 },
          { code: "SG", count: 400 },
          { code: "PL", count: 6 },
        ],
      }),
    );
    expect(found?.id).toBe("single-page-traffic");
    expect(found?.kind).toBe("acute");
    expect(found?.tone).toBe("act");
    // Names come from the runtime's ICU data, so only countries whose name never varies are used.
    expect(found?.headline).toBe(
      "Singapore and Poland sent 391 visits this week and almost none read past one page",
    );
    expect(found?.detail).toContain("Singapore: 278 visits, 100 percent single page");
    expect(found?.detail).toContain("Up sharply");
  });

  test("an old pattern is chronic and only worth watching", () => {
    const found = singlePageTraffic(
      pulse({
        countries: [country("CN", 60, 58, 60)],
        countriesBefore: [{ code: "CN", count: 240 }],
      }),
    );
    expect(found?.kind).toBe("chronic");
    expect(found?.tone).toBe("watch");
    expect(found?.detail).toContain("Not new");
  });

  test("a country that reads, or one too small to judge, is left alone", () => {
    expect(
      singlePageTraffic(
        pulse({
          countries: [
            country("DE", 686, 366),
            country("HK", 12, 12),
            country("PL", 80, 60),
          ],
        }),
      ),
    ).toBeNull();
  });
});

describe("signupsPerVisitFalling", () => {
  const signups = (perWeek: number[]) =>
    perWeek.flatMap((n, i) =>
      Array.from({ length: n }, () => user(weeks[i]?.from ?? "")),
    );

  test("fires when signups per engaged visit fall well below the four weeks before", () => {
    // 150 engaged a week throughout: baseline 12 signups over 600 visits = 20 per 1,000.
    const users = signups([1, 3, 3, 3, 3]);
    const found = signupsPerVisitFalling(users, pulse());
    expect(found?.id).toBe("signups-per-visit-falling");
    expect(found?.detail).toContain(
      "1 signup from 150 engaged visits this week (6.7 per 1,000)",
    );
    expect(found?.detail).toContain("20.0 per 1,000");
  });

  test("quiet when the rate holds, and when there is too little history to say", () => {
    expect(signupsPerVisitFalling(signups([3, 3, 3, 3, 3]), pulse())).toBeNull();
    expect(signupsPerVisitFalling(signups([0, 1, 1, 1, 1]), pulse())).toBeNull();
  });

  test("disposable addresses are not counted as signups", () => {
    const users = [
      ...signups([0, 3, 3, 3, 3]),
      ...Array.from({ length: 6 }, () =>
        user(weeks[0]?.from ?? "", { disposable: true }),
      ),
    ];
    expect(signupsPerVisitFalling(users, pulse())?.id).toBe("signups-per-visit-falling");
  });
});

describe("in the weekly panel", () => {
  test("without a pulse the traffic rules say nothing", () => {
    expect(allInsights([], [], [], TODAY).map((i) => i.id)).toEqual([]);
    expect(allInsights([], [], [], TODAY, null)).toEqual([]);
  });

  test("with one, they join the ranking and the cap still holds", () => {
    const found = weeklyInsights(
      [],
      [],
      [],
      TODAY,
      pulse({
        thisWeek: week(0, 400, 300),
        countries: [country("SG", 278, 278, 400)],
        countriesBefore: [{ code: "SG", count: 40 }],
      }),
    );
    expect(found.map((i) => i.id)).toEqual([
      "single-page-traffic",
      "engaged-visits-down",
    ]);
  });
});
