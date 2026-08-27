import { z } from "zod";

// Locale-keyed string: { en: "...", de: "...", fr: "..." }
// English is required at validation time; other locales are optional.
export const localeString = z
  .record(z.string(), z.string())
  .refine((r) => "en" in r, { message: "English (en) translation is required" });

// ─── Dictionary ──────────────────────────────────────────────

export const dictionaryTermSchema = z.object({
  term: z.string().min(1),
  type: z.enum(["defined", "vocabulary"]),
  definition: localeString,
  /**
   * Optional per-locale surface forms. Each alias matches in the wiki
   * auto-glosser when its locale is active. The canonical `term` field
   * stays English; aliases are how German and Dutch wiki prose finds
   * the same concept (Geschäftsleitung → Management body, etc.).
   */
  aliases: z
    .object({
      de: z.array(z.string().min(1)).optional(),
      en: z.array(z.string().min(1)).optional(),
      nl: z.array(z.string().min(1)).optional(),
    })
    .optional(),
});

export type DictionaryTerm = z.infer<typeof dictionaryTermSchema>;

// ─── Lesson ──────────────────────────────────────────────────

export const lessonSchema = z.object({
  id: z.string(), // e.g. "2.1"
  slug: z.string(), // e.g. "risk-equation"
  title: localeString,
  moduleId: z.string(),
  order: z.number().int().nonnegative(),
  contentFile: z.string(), // e.g. "2-1" — resolver appends .{locale}.md
  videoUrl: z.string().url().optional(),
  hasQuiz: z.boolean(),
  estimatedMinutes: z.number().positive(),
  nextLessonId: z.string().nullable(),
  prevLessonId: z.string().nullable(),
});

export type Lesson = z.infer<typeof lessonSchema>;

// ─── Quiz ────────────────────────────────────────────────────
//
// AUTHORING RULE: Every quiz question must be answerable using ONLY
// the content of the associated lesson text. The learner should not
// need external knowledge, prior lessons, or any other source to
// select the correct answer. If a question requires information not
// present in the lesson, either add that information to the lesson
// or remove the question.

export const quizQuestionSchema = z.object({
  id: z.string(),
  question: localeString,
  options: z.array(localeString).min(2).max(6),
  correctIndex: z.number().int().nonnegative(), // server-only — strip before sending to client
  explanation: localeString.optional(),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizSchema = z.object({
  lessonId: z.string(),
  passingScore: z.number().int().min(1).max(100).default(80),
  questions: z.array(quizQuestionSchema).min(1),
});

export type Quiz = z.infer<typeof quizSchema>;

// ─── Course ──────────────────────────────────────────────────

export const courseModuleSchema = z.object({
  id: z.string(),
  title: localeString,
  order: z.number().int().nonnegative(),
  lessonIds: z.array(z.string()).min(1),
});

export type CourseModule = z.infer<typeof courseModuleSchema>;

/**
 * What the completion certificate may claim about this course.
 *
 * Required, not optional. The certificate is a compliance document a learner
 * forwards to an auditor, and the basis line used to be one hardcoded string
 * in the PDF template — so the CRA SBOM course printed "Managementschulung
 * gemäß §38(3) BSIG". A course that has not stated its own basis should fail
 * to load rather than borrow the last one's.
 *
 * `legalBasis` cites the obligation the course actually teaches, in the same
 * wording the course content uses. `sealLabel` is the short mark on the seal.
 */
export const courseCertificateSchema = z.object({
  legalBasis: localeString,
  sealLabel: z.string().min(1).max(8),
});

export const courseSchema = z.object({
  id: z.string(),
  title: localeString,
  description: localeString,
  version: z.string(),
  certificate: courseCertificateSchema,
  modules: z.array(courseModuleSchema).min(1),
});

export type Course = z.infer<typeof courseSchema>;
