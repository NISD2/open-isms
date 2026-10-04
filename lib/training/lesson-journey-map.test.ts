import { describe, expect, test } from "bun:test";
import { WALK } from "@/lib/durchgang";
import { loadCourse } from "./course-loader";
import { LESSON_WALK_ITEM } from "./lesson-journey-map";

describe("LESSON_WALK_ITEM", () => {
  test("every lesson leads to an item the walk has", () => {
    const walked = new Set(WALK.map((item) => item.code));
    const dead = Object.entries(LESSON_WALK_ITEM).filter(([, code]) => !walked.has(code));
    expect(dead).toEqual([]);
  });

  test("every lesson it names is in the NIS2 course", async () => {
    const course = await loadCourse("nis2-ceo");
    const lessons = new Set(course.modules.flatMap((m) => m.lessonIds));
    expect(Object.keys(LESSON_WALK_ITEM).filter((id) => !lessons.has(id))).toEqual([]);
  });
});
