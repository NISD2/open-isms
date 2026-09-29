import { describe, expect, test } from "bun:test";
import { courseCompletion } from "./completion";

const lesson = (lessonId: string, day: number | null, completed = true) => ({
  lessonId,
  completed,
  completedAt: day === null ? null : new Date(Date.UTC(2026, 8, day)),
});

describe("courseCompletion", () => {
  test("is complete when every lesson is, dated by the last one", () => {
    expect(courseCompletion(["1", "2"], [lesson("1", 3), lesson("2", 5)])).toEqual({
      completedCount: 2,
      completedInCourse: 2,
      totalCount: 2,
      allCompleted: true,
      completionDate: new Date(Date.UTC(2026, 8, 5)),
    });
  });

  test("progress counts only current lessons; the certificate count stays as issued", () => {
    const result = courseCompletion(["1", "2"], [lesson("1", 3), lesson("old", 4)]);
    expect(result).toMatchObject({
      completedCount: 2,
      completedInCourse: 1,
      allCompleted: false,
      completionDate: null,
    });
  });

  test("a started but unfinished lesson does not count", () => {
    expect(courseCompletion(["1"], [lesson("1", 3, false)]).completedInCourse).toBe(0);
  });

  test("the certificate date keeps a removed lesson and the epoch fallback it was issued with", () => {
    const withRemoved = courseCompletion(["1"], [lesson("1", 3), lesson("old", 9)]);
    expect(withRemoved.completionDate).toEqual(new Date(Date.UTC(2026, 8, 9)));
    expect(courseCompletion(["1"], [lesson("1", null)]).completionDate).toEqual(
      new Date(0),
    );
  });
});
