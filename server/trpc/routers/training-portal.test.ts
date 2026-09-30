/**
 * The course certificate is issued once every lesson of a course is marked
 * complete, and for nis2-ceo it is the §38(3) BSIG training record. So the
 * one procedure that marks a lesson complete without a quiz must refuse every
 * lesson that has one, and must refuse lessons the course does not contain,
 * before it touches a progress row.
 */
import { describe, expect, mock, test } from "bun:test";
import { LOCALE_CODES } from "@/lib/locale";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: () => {} }));

const { createCallerFactory } = await import("../init");
const { trainingPortalRouter, lessonLocaleSchema, lessonRefSchema } = await import(
  "./training-portal"
);
const { COURSE_IDS, loadCourse, loadQuiz } = await import("@/lib/training/course-loader");
type TRPCContext = import("../init").TRPCContext;

const REFUSING_DB = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(`a refused call touched the database: .${String(prop)}`);
    },
  },
);

/** Just the drizzle calls completeLesson makes for a lesson with no progress yet. */
function recordingDb(inserted: unknown[]) {
  return {
    select: () => ({ from: () => ({ where: async () => [] }) }),
    insert: () => ({
      values: async (row: unknown) => {
        inserted.push(row);
      },
    }),
  };
}

function callerWith(db: unknown) {
  return createCallerFactory(trainingPortalRouter)({
    db: db as TRPCContext["db"],
    session: { user: { id: "user-1" } } as TRPCContext["session"],
    userId: "user-1",
    companyId: "company-1",
    ip: "test",
    userAgent: null,
  });
}

const quizLessons = (
  await Promise.all(
    COURSE_IDS.map(async (courseId) => {
      const course = await loadCourse(courseId);
      const lessonIds = course.modules.flatMap((m) => m.lessonIds);
      const withQuiz = await Promise.all(
        lessonIds.map(async (lessonId) =>
          (await loadQuiz(courseId, lessonId)) ? lessonId : null,
        ),
      );
      return withQuiz.flatMap((lessonId) =>
        lessonId ? [[courseId, lessonId] as const] : [],
      );
    }),
  )
).flat();

describe("trainingPortal.completeLesson", () => {
  test("the courses do have quiz lessons to guard", () => {
    expect(quizLessons.length).toBeGreaterThan(40);
  });

  test("refuses every lesson that has a quiz, without writing progress", async () => {
    const caller = callerWith(REFUSING_DB);
    for (const [courseId, lessonId] of quizLessons) {
      await expect(caller.completeLesson({ courseId, lessonId })).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });
    }
  });

  test("refuses lessons and courses outside the catalogue", async () => {
    const caller = callerWith(REFUSING_DB);
    for (const [courseId, lessonId] of [
      ["nis2-ceo", "9.9"],
      ["nis2-ceo", "2-1"],
      ["nis2-ceo", "x".repeat(16)],
      ["no-such-course", "0.1"],
    ]) {
      await expect(caller.completeLesson({ courseId, lessonId })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    }
  });

  test("still completes a lesson without a quiz", async () => {
    const inserted: unknown[] = [];
    await callerWith(recordingDb(inserted)).completeLesson({
      courseId: "nis2-ceo",
      lessonId: "0.1",
    });
    expect(inserted).toEqual([
      expect.objectContaining({
        userId: "user-1",
        courseId: "nis2-ceo",
        lessonId: "0.1",
        completed: true,
      }),
    ]);
  });
});

describe("lesson input schemas", () => {
  test("accept every locale the app ships and default to English", () => {
    for (const locale of LOCALE_CODES) {
      expect(lessonLocaleSchema.parse(locale)).toBe(locale);
    }
    expect(lessonLocaleSchema.parse(undefined)).toBe("en");
  });

  test("refuse a locale that could reach the filesystem as a path", () => {
    for (const locale of ["/../../../../README", "../x", "en/..", "", "EN"]) {
      expect(lessonLocaleSchema.safeParse(locale).success).toBe(false);
    }
  });

  test("cap the lesson reference before any lookup", () => {
    const accepts = (courseId: string, lessonId: string) =>
      lessonRefSchema.safeParse({ courseId, lessonId }).success;
    expect(accepts("nis2-ceo", "2.15")).toBe(true);
    expect(accepts("nis2-ceo", "x".repeat(17))).toBe(false);
    expect(accepts("c".repeat(65), "0.1")).toBe(false);
    expect(accepts("nis2-ceo", "")).toBe(false);
  });

  test("getLesson refuses a traversal locale before reading anything", async () => {
    await expect(
      callerWith(REFUSING_DB).getLesson({
        courseId: "nis2-ceo",
        lessonId: "0.1",
        locale: "/../../../../README",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
