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
      totalCount: 2,
      allCompleted: true,
      completionDate: new Date(Date.UTC(2026, 8, 5)),
    });
  });

  test("progress on a lesson no longer in the course does not count", () => {
    const result = courseCompletion(["1", "2"], [lesson("1", 3), lesson("old", 4)]);
    expect(result).toMatchObject({ completedCount: 1, allCompleted: false });
    expect(result.completionDate).toBeNull();
  });

  test("a started but unfinished lesson does not count", () => {
    expect(courseCompletion(["1"], [lesson("1", 3, false)]).completedCount).toBe(0);
  });

  test("complete without any recorded date has no date rather than 1970", () => {
    expect(courseCompletion(["1"], [lesson("1", null)]).completionDate).toBeNull();
  });
});
