import { describe, expect, test } from "bun:test";
import { type LeadFacts, leadReasons } from "./leads";

describe("lead reasons", () => {
  const none: LeadFacts = {
    finishedCourses: 0,
    startedCourses: 0,
    companyActivated: false,
    walkActions: 0,
    logins: 1,
    colleaguesInTraining: 0,
    colleagues: 0,
  };

  test("lists nothing for a person who only signed in", () => {
    expect(leadReasons(none)).toEqual([]);
  });

  test("names each reason that holds, and a started course only until one is finished", () => {
    expect(leadReasons({ ...none, startedCourses: 1 })).toEqual(["started a course"]);
    expect(
      leadReasons({
        ...none,
        finishedCourses: 1,
        startedCourses: 1,
        companyActivated: true,
        logins: 4,
        colleaguesInTraining: 2,
        colleagues: 5,
      }),
    ).toEqual([
      "finished 1 course(s)",
      "company is set up",
      "4 sign-ins",
      "2 of 5 colleagues are in training",
    ]);
  });
});
