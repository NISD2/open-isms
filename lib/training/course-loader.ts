import "@/lib/server-guard";

import { readFile } from "fs/promises";
import { join } from "path";
import type { Course, Lesson, Quiz, DictionaryTerm } from "./schemas";

const COURSES_DIR = join(process.cwd(), "courses");

/**
 * Allowlist of course IDs. Bundler dynamic-import context restricts paths
 * to `@/courses/*`, but we still validate inputs at the JS layer so a
 * caller can't pass arbitrary tokens (e.g. with `..`) and fish for module
 * resolution errors as a side-channel.
 */
export const COURSE_IDS = ["nis2-ceo", "nis2-tabletop", "cra-sbom"] as const;
const KNOWN_COURSES = new Set<string>(COURSE_IDS);

function assertKnownCourse(courseId: string): void {
  if (!KNOWN_COURSES.has(courseId)) {
    throw new Error(`Unknown course: ${courseId}`);
  }
}

/**
 * Load a course definition by ID.
 */
export async function loadCourse(courseId: string): Promise<Course> {
  assertKnownCourse(courseId);
  const mod = await import(`@/courses/${courseId}/index`);
  return mod.default;
}

/**
 * Load a lesson's metadata by course and lesson ID.
 * Lesson ID "2.1" maps to file "2-1.ts".
 */
export async function loadLesson(
  courseId: string,
  lessonId: string,
): Promise<Lesson> {
  assertKnownCourse(courseId);
  const fileSlug = lessonId.replace(".", "-");
  const mod = await import(`@/courses/${courseId}/lessons/${fileSlug}`);
  return mod.default;
}

/**
 * Module / lesson / minute totals for a course.
 *
 * The landing page states the whole commitment up front. Analytics for
 * the 30 days to 2026-08-31 showed 80 visitors on the NIS 2 for CEOs
 * landing page, 27 opening lesson 0.1 and 7 reaching the last lesson —
 * and lessons 5.1/5.2 (7 each) outdrawing every lesson in module 4 (a
 * flat 4), i.e. people skipping to the end. Both patterns point at
 * "how big is this and can I start where I need to", which the page
 * previously never answered: the only CTA started at 0.1.
 */
export async function courseTotals(courseId: string): Promise<{
  modules: number;
  lessons: number;
  minutes: number;
}> {
  const course = await loadCourse(courseId);
  const lessonIds = course.modules.flatMap((m) => m.lessonIds);
  const lessons = await Promise.all(
    lessonIds.map((id) => loadLesson(courseId, id)),
  );
  return {
    modules: course.modules.length,
    lessons: lessonIds.length,
    minutes: lessons.reduce((sum, l) => sum + (l.estimatedMinutes ?? 0), 0),
  };
}

/**
 * Load a quiz by course and lesson ID.
 * Returns null if the lesson has no quiz.
 */
export async function loadQuiz(
  courseId: string,
  lessonId: string,
): Promise<Quiz | null> {
  assertKnownCourse(courseId);
  const fileSlug = lessonId.replace(".", "-");
  try {
    const mod = await import(`@/courses/${courseId}/quizzes/${fileSlug}`);
    return mod.default;
  } catch {
    return null;
  }
}

/**
 * Load the course-level dictionary.
 */
export async function loadDictionary(
  courseId: string,
): Promise<DictionaryTerm[]> {
  assertKnownCourse(courseId);
  const mod = await import(`@/courses/${courseId}/dictionary`);
  return mod.default;
}

/**
 * Load the markdown content for a lesson.
 * Tries {lessonSlug}.{locale}.md first, falls back to {lessonSlug}.en.md.
 */
export async function loadLessonContent(
  courseId: string,
  lessonId: string,
  locale: string,
): Promise<string> {
  assertKnownCourse(courseId);
  const fileSlug = lessonId.replace(".", "-");
  const contentDir = join(COURSES_DIR, courseId, "content");

  // Try locale-specific file first
  const localePath = join(contentDir, `${fileSlug}.${locale}.md`);
  try {
    return await readFile(localePath, "utf-8");
  } catch {
    // Fall back to English
    const enPath = join(contentDir, `${fileSlug}.en.md`);
    return await readFile(enPath, "utf-8");
  }
}
