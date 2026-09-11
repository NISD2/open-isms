/**
 * The weekly panel is the one part of the Graphs tab that makes a judgement
 * rather than plotting a number, so its thresholds are the thing worth pinning
 * down: when a rule fires, when it stays quiet, and that the same facts always
 * produce the same three findings in the same order.
 */
import { describe, expect, test } from "bun:test";
import type { CompanyFact, DailyWorkRow, UserFact } from "@/lib/platform-admin/growth";
import { MAX_INSIGHTS, weeklyInsights } from "./insights";
import { addDays } from "./range";

const TODAY = "2026-03-01";
const ago = (days: number) => addDays(TODAY, -days);

function user(overrides: Partial<UserFact> = {}): UserFact {
  return {
    signupDay: ago(90),
    verified: true,
    disposable: false,
    locale: "de",
    inOrg: true,
    activatedDay: ago(89),
    activeDays: [],
    workEvents: 0,
    complianceEvents: 0,
    signOffs: 0,
    coursesStarted: [],
    coursesFinished: [],
    ...overrides,
  };
}

function company(overrides: Partial<CompanyFact> = {}): CompanyFact {
  return {
    createdDay: ago(90),
    activatedDay: ago(89),
    sector: "energy",
    country: "DE",
    entityType: "important",
    plan: "free",
    employeeCount: 120,
    actsAsSupplier: false,
    actsAsNis2Entity: true,
    seats: 1,
    compliancePct: 0,
    questionnairePct: null,
    ...overrides,
  };
}

const run = (
  users: UserFact[],
  companies: CompanyFact[] = [],
  work: DailyWorkRow[] = [],
) => weeklyInsights(users, companies, work, TODAY);

const ids = (users: UserFact[], companies?: CompanyFact[], work?: DailyWorkRow[]) =>
  run(users, companies, work).map((i) => i.id);

describe("weeklyInsights", () => {
  test("a platform with nothing on it produces no findings", () => {
    expect(run([])).toEqual([]);
  });

  test("a steady week produces no findings", () => {
    // Active every week including this one, everyone activated, nothing stalled.
    const steady = Array.from({ length: 6 }, () =>
      user({
        activeDays: [ago(1), ago(9), ago(16), ago(23), ago(30)],
        workEvents: 5,
        signOffs: 1,
      }),
    );
    expect(ids(steady)).toEqual([]);
  });

  test("a week where nobody worked outranks everything else", () => {
    const wasActive = Array.from({ length: 5 }, () =>
      user({ activeDays: [ago(10), ago(17), ago(24), ago(31)], workEvents: 4 }),
    );
    const found = run(wasActive);
    expect(found[0]?.id).toBe("activity-zero");
    expect(found[0]?.tone).toBe("act");
  });

  test("the draft-shell backlog fires, and says whether it is still growing", () => {
    const stuck = Array.from({ length: 8 }, () =>
      user({ activatedDay: null, signupDay: ago(40) }),
    );
    const growing = [
      ...stuck,
      ...Array.from({ length: 3 }, () =>
        user({ activatedDay: null, signupDay: ago(10) }),
      ),
    ];
    expect(ids(stuck)).toContain("draft-shell-backlog");

    const flat = run(stuck).find((i) => i.id === "draft-shell-backlog");
    const rising = run(growing).find((i) => i.id === "draft-shell-backlog");
    expect(flat?.detail).toContain("stopped growing");
    expect(rising?.detail).toContain("still growing");
    // Growth has to raise the ranking, or a chronic backlog never gets worse.
    expect(rising?.severity ?? 0).toBeGreaterThan(flat?.severity ?? 0);
  });

  test("two stuck accounts are not worth anyone's week", () => {
    const barely = Array.from({ length: 2 }, () =>
      user({ activatedDay: null, signupDay: ago(40) }),
    );
    expect(ids(barely)).not.toContain("draft-shell-backlog");
  });

  test("people who worked and went quiet are surfaced", () => {
    const stalled = Array.from({ length: 4 }, () =>
      user({ activeDays: [ago(40), ago(30)], workEvents: 6 }),
    );
    expect(ids(stalled)).toContain("stalled-workers");
  });

  test("someone who signed a requirement off is not counted as stalled", () => {
    const done = Array.from({ length: 4 }, () =>
      user({ activeDays: [ago(40), ago(30)], workEvents: 6, signOffs: 2 }),
    );
    expect(ids(done)).not.toContain("stalled-workers");
  });

  test("course finishers who never used the platform are surfaced", () => {
    const idle = Array.from({ length: 3 }, () =>
      user({ coursesFinished: [{ courseId: "nis2-ceo", day: ago(30) }] }),
    );
    expect(ids(idle)).toContain("course-finishers-idle");
  });

  test("a course finisher counts as idle even though the lessons were work", () => {
    // Regression: the rule first tested total work events, which a 47-lesson
    // course guarantees, so it could never fire for the people it describes.
    const finished = Array.from({ length: 3 }, () =>
      user({
        coursesFinished: [{ courseId: "nis2-ceo", day: ago(30) }],
        workEvents: 47,
        complianceEvents: 0,
      }),
    );
    expect(ids(finished)).toContain("course-finishers-idle");

    const alsoWorked = finished.map((u) => ({ ...u, complianceEvents: 12 }));
    expect(ids(alsoWorked)).not.toContain("course-finishers-idle");
  });

  test("a supplier who signed up this week is not chased for being mid-form", () => {
    const fresh = [
      company({ actsAsSupplier: true, questionnairePct: 0, createdDay: ago(3) }),
    ];
    expect(ids([], fresh)).not.toContain("supplier-questionnaire-gap");

    const overdue = [
      company({ actsAsSupplier: true, questionnairePct: 0, createdDay: ago(30) }),
    ];
    expect(ids([], overdue)).toContain("supplier-questionnaire-gap");
  });

  test("a falling activation rate needs a cohort big enough to mean anything", () => {
    // Four recent signups, none activated: a real collapse in ratio terms,
    // but four people is noise and the rule must stay quiet.
    const tiny = [
      ...Array.from({ length: 4 }, () =>
        user({ signupDay: ago(12), activatedDay: null }),
      ),
      ...Array.from({ length: 8 }, () =>
        user({ signupDay: ago(30), activatedDay: ago(29) }),
      ),
    ];
    expect(ids(tiny)).not.toContain("activation-rate-falling");

    const enough = [
      ...Array.from({ length: 10 }, () =>
        user({ signupDay: ago(12), activatedDay: null }),
      ),
      ...Array.from({ length: 10 }, () =>
        user({ signupDay: ago(30), activatedDay: ago(29) }),
      ),
    ];
    expect(ids(enough)).toContain("activation-rate-falling");
  });

  test("good news gets said out loud", () => {
    const surge = [
      ...Array.from({ length: 9 }, () => user({ signupDay: ago(2) })),
      ...Array.from({ length: 2 }, () => user({ signupDay: ago(15) })),
    ];
    const good = run(surge).find((i) => i.tone === "good");
    expect(good?.id).toBe("growth-up");
  });

  test("never more than three, however much is wrong", () => {
    const everything = [
      ...Array.from({ length: 12 }, () =>
        user({ activatedDay: null, signupDay: ago(40) }),
      ),
      ...Array.from({ length: 8 }, () => user({ activeDays: [ago(40)], workEvents: 3 })),
      ...Array.from({ length: 6 }, () =>
        user({ coursesFinished: [{ courseId: "nis2-ceo", day: ago(30) }] }),
      ),
      ...Array.from({ length: 10 }, () =>
        user({ signupDay: ago(12), activatedDay: null }),
      ),
      ...Array.from({ length: 10 }, () =>
        user({ signupDay: ago(30), activatedDay: ago(29) }),
      ),
    ];
    const suppliers = Array.from({ length: 5 }, () =>
      company({ actsAsSupplier: true, questionnairePct: 0, createdDay: ago(30) }),
    );
    expect(run(everything, suppliers).length).toBe(MAX_INSIGHTS);
  });

  test("the same facts always give the same findings in the same order", () => {
    const facts = [
      ...Array.from({ length: 9 }, () =>
        user({ activatedDay: null, signupDay: ago(40) }),
      ),
      ...Array.from({ length: 5 }, () => user({ activeDays: [ago(40)], workEvents: 3 })),
    ];
    expect(ids(facts)).toEqual(ids(facts));
  });

  test("disposable signups never drive a finding", () => {
    const bots = Array.from({ length: 30 }, () =>
      user({ disposable: true, activatedDay: null, signupDay: ago(40) }),
    );
    expect(ids(bots)).toEqual([]);
  });

  test("work with no sign-off for a fortnight is flagged", () => {
    const work: DailyWorkRow[] = [
      { day: ago(3), completed: 6, signedOff: 0, evidence: 2 },
      { day: ago(9), completed: 4, signedOff: 0, evidence: 0 },
    ];
    expect(ids([], [], work)).toContain("signoff-drought");
  });
});
