import { pgTable, text, integer, pgEnum, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const jobStatusEnum = pgEnum("job_status", [
  "uploading",
  "analyzing",
  "stage1_review",
  "processing",
  "stage2_review",
  "rendering",
  "done",
  "error",
]);

export const clipStatusEnum = pgEnum("clip_status", [
  "suggested",
  "stage1_approved",
  "processing",
  "stage2_review",
  "final_approved",
  "rejected",
  "rendering",
  "done",
  "error",
]);

export type ClipSegment = { startMs: number; endMs: number };

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  originalFilename: text("original_filename").notNull(),
  uploadPath: text("upload_path").notNull(),
  videoDurationMs: integer("video_duration_ms"),

  // Gemini transcript (uploaded alongside video)
  mode: text("mode").notNull().default("daily"), // "daily" | "longform"

  // Gemini transcript (uploaded alongside video, daily mode only)
  geminiTranscriptPath: text("gemini_transcript_path"),
  transcriptText: text("transcript_text"), // parsed Gemini text sent to Grok
  customContext: text("custom_context"),   // optional user-provided context for Grok analysis

  // Longform mode: full-video edit outputs
  editedVideoPath: text("edited_video_path"),       // public/edited-{id}.mp4
  editedCaptionsPath: text("edited_captions_path"), // public/captions-{id}-edited.json

  status: jobStatusEnum("status").notNull().default("uploading"),
  errorMessage: text("error_message"),

  outputDateDir: text("output_date_dir"),
});

export const clips = pgTable("clips", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  title: text("title").notNull(),
  rationale: text("rationale"),
  sortOrder: integer("sort_order").notNull().default(0),

  // Multi-segment: array of {startMs, endMs} — replaces flat clipStartMs/clipEndMs
  segments: jsonb("segments").$type<ClipSegment[]>().notNull().default([]),

  // Populated after per-clip processing (during analyze step)
  gapEditedPath: text("gap_edited_path"),       // public/gap-edited-{id}.mp4
  previewPath: text("preview_path"),             // out/previews/{id}-preview.mp4
  clipCaptionsPath: text("clip_captions_path"),  // public/captions-{id}-remapped.json
  removedIntervals: jsonb("removed_intervals").$type<{ startMs: number; endMs: number }[]>(), // Grok 2 edit decisions

  status: clipStatusEnum("status").notNull().default("suggested"),
  errorMessage: text("error_message"),

  outputPath: text("output_path"),
  slug: text("slug"),
});

export const sections = pgTable("sections", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  title: text("title").notNull(),
  subtitle: text("subtitle"),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  included: boolean("included").notNull().default(true),
});

export const jobsRelations = relations(jobs, ({ many }) => ({
  clips: many(clips),
  sections: many(sections),
}));

export const clipsRelations = relations(clips, ({ one }) => ({
  job: one(jobs, { fields: [clips.jobId], references: [jobs.id] }),
}));

export const sectionsRelations = relations(sections, ({ one }) => ({
  job: one(jobs, { fields: [sections.jobId], references: [jobs.id] }),
}));

export type Job = typeof jobs.$inferSelect;
export type Clip = typeof clips.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type JobStatus = Job["status"];
export type ClipStatus = Clip["status"];
