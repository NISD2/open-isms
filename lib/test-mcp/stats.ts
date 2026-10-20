import type { GrowthData } from "@/lib/platform-admin/growth";

/**
 * How people move through the product, folded from the Graphs tab's fact rows
 * (lib/platform-admin/growth.ts), so a number here is the number the tab shows. Pure.
 */

export interface DayRange {
  /** Berlin-agnostic UTC calendar days, YYYY-MM-DD, both included; the facts are UTC days. */
  readonly fromDay: string;
  readonly toDay: string;
}

const within = (day: string, r: DayRange) => day >= r.fromDay && day <= r.toDay;

/** How many times each value occurs, as [value, count] pairs. */
const countEach = (values: readonly string[]): Array<[string, number]> =>
  Object.entries(Object.groupBy(values, (v) => v)).map(([value, same]) => [
    value,
    same?.length ?? 0,
  ]);

const topCounts = (values: readonly (string | null)[], n: number) =>
  countEach(values.map((v) => v ?? "(none)"))
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([value, people]) => ({ value, people }));

/** The funnel of everyone who signed up in the range: how many reached each step, ever. */
export function summarize(growth: GrowthData, range: DayRange) {
  const signedUp = growth.users.filter((u) => within(u.signupDay, range));
  const step = (label: string, people: number) => ({
    step: label,
    people,
    ofSignups:
      signedUp.length === 0 ? null : Math.round((people / signedUp.length) * 100),
  });
  return {
    range,
    funnel: [
      step("signed up", signedUp.length),
      step("verified the address", signedUp.filter((u) => u.verified).length),
      step("has a company", signedUp.filter((u) => u.inOrg).length),
      step("company activated", signedUp.filter((u) => u.activatedDay !== null).length),
      step(
        "did any work (lessons, requirements, evidence)",
        signedUp.filter((u) => u.workEvents > 0).length,
      ),
      step(
        "did compliance work (not only lessons)",
        signedUp.filter((u) => u.complianceEvents > 0).length,
      ),
      step(
        "came back on another day",
        signedUp.filter((u) => u.activeDays.length > 1).length,
      ),
      step("signed off a requirement", signedUp.filter((u) => u.signOffs > 0).length),
    ],
    signupsByDay: countEach(signedUp.map((u) => u.signupDay)).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
    fromPages: topCounts(
      signedUp.map((u) => u.fromPath),
      10,
    ),
    campaigns: Object.entries(Object.groupBy(signedUp, (u) => u.utmCampaign ?? "(none)"))
      .map(([campaign, people]) => ({
        campaign,
        signups: people?.length ?? 0,
        activatedCompany: people?.filter((u) => u.activatedDay !== null).length ?? 0,
        didComplianceWork: people?.filter((u) => u.complianceEvents > 0).length ?? 0,
      }))
      .sort((a, b) => b.signups - a.signups)
      .slice(0, 10),
    languages: topCounts(
      signedUp.map((u) => u.locale),
      6,
    ),
    disposableAddresses: signedUp.filter((u) => u.disposable).length,
    coursesStarted: Object.fromEntries(
      Object.keys(growth.courseLessonCounts).map((courseId) => [
        courseId,
        {
          started: signedUp.filter((u) => u.coursesStarted.some((c) => c === courseId))
            .length,
          finished: signedUp.filter((u) =>
            u.coursesFinished.some((c) => c.courseId === courseId),
          ).length,
        },
      ]),
    ),
    activePeoplePerDay: growth.activity.filter((d) => within(d.day, range)),
    workPerDay: growth.work.filter((d) => within(d.day, range)),
    lessonsCompletedPerDay: growth.lessons.filter((d) => within(d.day, range)),
    companies: {
      total: growth.companies.length,
      activated: growth.companies.filter((c) => c.activatedDay !== null).length,
      byPlan: topCounts(
        growth.companies.map((c) => c.plan),
        6,
      ),
      bySector: topCounts(
        growth.companies.map((c) => c.sector),
        8,
      ),
      byCountry: topCounts(
        growth.companies.map((c) => c.country),
        8,
      ),
    },
  };
}
