import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { LOCALE_CODES } from "@/lib/locale";
import { isCourseLesson, loadLessonContent } from "./course-loader";

/**
 * Locales that path.join would happily turn into a path outside the course.
 * The first is the shape the audit found: it resolves to the repo's README.
 */
const TRAVERSAL_LOCALES = [
  "/../../../../README",
  "../../../../README",
  "en/../../../../README",
  "..",
  "",
  "EN",
  "de-DE",
  "en\u0000",
];

describe("isCourseLesson", () => {
  test("accepts lessons listed in the course", async () => {
    expect(await isCourseLesson("nis2-ceo", "0.1")).toBe(true);
    expect(await isCourseLesson("nis2-ceo", "2.15")).toBe(true);
    expect(await isCourseLesson("cra-sbom", "4.1")).toBe(true);
  });

  // "2-1" loads the same lesson file as "2.1", so a check that only asked
  // whether the file exists would let it write a progress row nobody counts.
  test("refuses the file-name form of a real lesson ID", async () => {
    expect(await isCourseLesson("nis2-ceo", "2-1")).toBe(false);
  });

  test("refuses unknown lessons and unknown courses", async () => {
    expect(await isCourseLesson("nis2-ceo", "9.9")).toBe(false);
    expect(await isCourseLesson("nis2-ceo", "../../../../README")).toBe(false);
    expect(await isCourseLesson("nis2-ceo", "")).toBe(false);
    expect(await isCourseLesson("no-such-course", "0.1")).toBe(false);
  });
});

describe("loadLessonContent", () => {
  test("reads the lesson in every shipped locale", async () => {
    for (const locale of LOCALE_CODES) {
      const markdown = await loadLessonContent("nis2-ceo", "0.1", locale);
      expect(markdown.length).toBeGreaterThan(0);
    }
  });

  // nis2-tabletop ships no Dutch content, so a shipped locale without its own
  // file must still fall back rather than be refused.
  test("falls back to English for a shipped locale that has no file", async () => {
    expect(await loadLessonContent("nis2-tabletop", "1.1", "nl")).toBe(
      await loadLessonContent("nis2-tabletop", "1.1", "en"),
    );
  });

  test("the audit's traversal locale really does escape the course directory", () => {
    const contentDir = join(process.cwd(), "courses", "nis2-ceo", "content");
    expect(join(contentDir, "0-1./../../../../README.md")).toBe(
      join(process.cwd(), "README.md"),
    );
  });

  test.each(TRAVERSAL_LOCALES)("refuses the locale %p", async (locale) => {
    await expect(loadLessonContent("nis2-ceo", "0.1", locale)).rejects.toThrow(
      "Unsupported lesson locale",
    );
  });

  test("refuses a lesson ID that is not in the course", async () => {
    for (const lessonId of ["2-1", "9.9", "../../../../README"]) {
      await expect(loadLessonContent("nis2-ceo", lessonId, "en")).rejects.toThrow(
        "Unknown lesson",
      );
    }
  });
});
