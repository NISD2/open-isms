/**
 * Training Lesson Progress — tracks per-user, per-lesson completion
 * and quiz scores for the training portal.
 *
 * Each row represents one user's progress on one lesson in one course.
 * Current lesson is derived by finding the first incomplete lesson
 * in course order — no separate enrollment table needed.
 *
 * References: companies, users
 */
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { company, user } from "./organization";

export const trainingLessonProgress = pgTable(
  "training_lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id)
      .notNull(),
    companyId: uuid("company_id").references(() => company.id),
    courseId: text("course_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    completed: boolean("completed").notNull().default(false),
    quizScore: integer("quiz_score"),
    quizPassed: boolean("quiz_passed"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("uq_training_progress_user_course_lesson").on(
      table.userId,
      table.courseId,
      table.lessonId,
    ),
    index("idx_training_progress_company_course").on(
      table.companyId,
      table.courseId,
    ),
  ],
);
