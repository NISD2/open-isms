import { createXai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { jobs, clips, sections } from "../schema";
import { eq } from "drizzle-orm";
import { emitJobEvent } from "./queue";
import { transcribeFullVideo, buildTranscriptFromCaptions, getVideoDurationMs } from "./transcribeClip";
import { grokEditFullVideo } from "./grokEdit";
import { remapCaptions } from "../lib/remapCaptions";
import type { Caption, RemovedInterval } from "../lib/remapCaptions";
import type { ClipSegment } from "../schema";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");

// ── Schemas ───────────────────────────────────────────────────────────────────

const SectionSuggestionSchema = z.object({
  sections: z
    .array(
      z.object({
        title: z.string().describe("Section title (3–8 words, topic-focused)"),
        subtitle: z.string().describe("Short label shown above title (1–4 words, e.g. 'NIS2 Basics', 'Key Deadlines')"),
        startMs: z.number().describe("Section start time in the edited video timeline (ms)"),
        endMs: z.number().describe("Section end time in the edited video timeline (ms)"),
      })
    )
    .min(3)
    .max(8),
});

const SegmentSchema = z.object({
  startMs: z.number().describe("Start time in ms in the edited video timeline. Use the nearest [M:SS = Nms] marker."),
  endMs: z.number().describe("End time in ms. Must be after startMs."),
});

const ShortSuggestionSchema = z.object({
  clips: z
    .array(
      z.object({
        title: z.string().describe("Short punchy title for YouTube Shorts / LinkedIn (under 60 chars)."),
        rationale: z.string().describe("2–3 sentences: what the clip is about and the viewer takeaway."),
        segments: z
          .array(SegmentSchema)
          .min(1)
          .max(4)
          .describe("1–4 time ranges to stitch. Timestamps are in the already-edited video timeline."),
        totalDurationSeconds: z.number().describe("Sum of all segment durations in seconds. Must be between 30 and 90."),
      })
    )
    .min(2)
    .max(6),
});

// ── Caption helpers ───────────────────────────────────────────────────────────

/**
 * Slices edited captions for a multi-segment clip and shifts timestamps to 0-based.
 * Works like remapCaptions but only for the clip's segments.
 */
function sliceCaptionsForClip(editedCaptions: Caption[], segments: ClipSegment[]): Caption[] {
  const segCaptions = editedCaptions.filter((c) =>
    segments.some((seg) => c.startMs >= seg.startMs && c.endMs <= seg.endMs)
  );

  // Structural removals: pre-clip offset + inter-segment gaps
  const structuralRemovals: RemovedInterval[] = [];
  if (segments[0].startMs > 0) {
    structuralRemovals.push({ startMs: 0, endMs: segments[0].startMs });
  }
  for (let i = 0; i < segments.length - 1; i++) {
    structuralRemovals.push({ startMs: segments[i].endMs, endMs: segments[i + 1].startMs });
  }

  return remapCaptions(segCaptions, structuralRemovals);
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function runLongformAnalysis(jobId: string): Promise<void> {
  console.log(`[analyzeLongform] Starting for job: ${jobId}`);
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) throw new Error(`Job ${jobId} not found`);

  try {
    await db.update(jobs).set({ status: "analyzing", updatedAt: new Date() }).where(eq(jobs.id, jobId));
    const absVideoPath = path.join(VIDEOS_DIR, job.uploadPath);

    // ── Phase 1: Whisper full video ──────────────────────────────────────────
    emitJobEvent(jobId, { type: "status", status: "analyzing", message: "Transcribing full video with Whisper..." });
    console.log("[analyzeLongform] Phase 1: Whisper transcription");

    let rawCaptions = await transcribeFullVideo(jobId, absVideoPath);
    console.log(`[analyzeLongform] Whisper complete: ${rawCaptions.length} words`);

    // ── Phase 2: Grok full-video edit pass ───────────────────────────────────
    emitJobEvent(jobId, { type: "progress", message: "Grok editing full video (removing fillers & dead air)..." });
    console.log("[analyzeLongform] Phase 2: Grok full-video edit");

    const durationMs = getVideoDurationMs(absVideoPath);
    const { removedIntervals, outputFilename: editedFilename } = await grokEditFullVideo({
      jobId,
      absInputPath: absVideoPath,
      durationMs,
      captions: rawCaptions,
    });
    const editedVideoPath = `public/${editedFilename}`;

    // ── Phase 3: Remap captions to edited timeline ────────────────────────────
    console.log("[analyzeLongform] Phase 3: Remapping captions to edited timeline");
    const editedCaptions = remapCaptions(rawCaptions, removedIntervals);
    const editedCaptionsFilename = `captions-${jobId}-edited.json`;
    fs.writeFileSync(path.join(PUBLIC_DIR, editedCaptionsFilename), JSON.stringify(editedCaptions, null, 2));
    const editedCaptionsPath = `public/${editedCaptionsFilename}`;
    console.log(`[analyzeLongform] Edited captions: ${editedCaptions.length} words`);

    // Save edited paths and transcript to job
    const editedTranscriptText = buildTranscriptFromCaptions(editedCaptions);
    await db.update(jobs).set({
      editedVideoPath,
      editedCaptionsPath,
      transcriptText: editedTranscriptText,
      updatedAt: new Date(),
    }).where(eq(jobs.id, jobId));

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("XAI_API_KEY environment variable is not set");
    const xai = createXai({ apiKey });

    // ── Phase 4: Grok section suggestions ────────────────────────────────────
    emitJobEvent(jobId, { type: "progress", message: "Grok analyzing sections..." });
    console.log("[analyzeLongform] Phase 4: Grok section suggestions");

    const { object: sectionObj } = await generateObject({
      model: xai("grok-4-1-fast-non-reasoning"),
      schema: SectionSuggestionSchema,
      system: `You are a YouTube video editor for a NIS2 cybersecurity compliance channel (NISD2).
The speaker (Cory) records solo educational videos (5–10 min) explaining specific NIS2 topics.
Your job: identify 3–8 major logical sections in the video.

GOOD SECTIONS:
- Clear topic shifts (e.g. "What is NIS2?" → "Who is affected?" → "What you need to do")
- Each section covers a distinct sub-topic or argument
- Sections should be meaningful chapter markers for YouTube chapter navigation
- Avoid sections shorter than 30 seconds or longer than 3 minutes

Use the edited transcript timestamps (already cleaned of fillers).`,
      prompt: `Here is the edited transcript of the video. Timestamps: [M:SS = Nms].
${job.customContext ? `\nAdditional context: ${job.customContext}\n` : ""}
Identify 3–8 meaningful sections for YouTube chapter markers.

Transcript:
${editedTranscriptText}`,
    });

    console.log(`[analyzeLongform] Phase 4: ${sectionObj.sections.length} sections suggested`);

    const now = new Date();
    for (let i = 0; i < sectionObj.sections.length; i++) {
      const s = sectionObj.sections[i];
      await db.insert(sections).values({
        id: crypto.randomUUID(),
        jobId,
        title: s.title,
        subtitle: s.subtitle,
        startMs: s.startMs,
        endMs: s.endMs,
        sortOrder: i,
        included: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ── Phase 5: Grok shorts suggestions ─────────────────────────────────────
    emitJobEvent(jobId, { type: "progress", message: "Grok suggesting shorts..." });
    console.log("[analyzeLongform] Phase 5: Grok shorts suggestions");

    const { object: shortObj } = await generateObject({
      model: xai("grok-4-1-fast-non-reasoning"),
      schema: ShortSuggestionSchema,
      system: `You are a video editor for a NIS2 cybersecurity YouTube channel (NISD2).
The speaker records solo educational videos for IT managers, CISOs, and business owners in EU companies.
From the edited video, pick 2–6 moments that work as standalone YouTube Shorts / LinkedIn clips.

WHAT MAKES A GOOD SHORT:
- A clear, self-contained insight or explanation (30–90 seconds)
- Surprising or counterintuitive facts: deadlines, fines, obligations most companies get wrong
- A concrete example or analogy that makes the topic click
- A punchy opening that hooks immediately

HARD RULES:
- totalDurationSeconds must be 30–90. Equals the sum of all segment durations, NOT wall-clock span.
- Each segment starts and ends at complete sentence boundaries.
- The clip must be self-contained — a stranger should understand it with no prior context.
- Timestamps are in the EDITED video timeline (fillers already removed). Use the [M:SS = Nms] markers.`,
      prompt: `Edited transcript of a NIS2 YouTube video. Timestamps: [M:SS = Nms].
${job.customContext ? `\nAdditional context: ${job.customContext}\n` : ""}
Suggest 2–6 clips for YouTube Shorts / LinkedIn.
Verify totalDurationSeconds = sum((endMs-startMs)/1000) for all segments.

Transcript:
${editedTranscriptText}`,
    });

    console.log(`[analyzeLongform] Phase 5: ${shortObj.clips.length} shorts suggested`);
    emitJobEvent(jobId, { type: "progress", message: `${shortObj.clips.length} shorts suggested. Preparing captions...` });

    // ── Phase 6: Slice captions per short (no Whisper needed) ────────────────
    console.log("[analyzeLongform] Phase 6: Slicing captions per short");

    for (let i = 0; i < shortObj.clips.length; i++) {
      const suggestion = shortObj.clips[i];
      const clipId = crypto.randomUUID();

      await db.insert(clips).values({
        id: clipId,
        jobId,
        title: suggestion.title,
        rationale: suggestion.rationale,
        sortOrder: i,
        segments: suggestion.segments as ClipSegment[],
        status: "suggested",
        createdAt: now,
        updatedAt: now,
      });

      try {
        const clipCaptions = sliceCaptionsForClip(editedCaptions, suggestion.segments as ClipSegment[]);
        const captionsFilename = `captions-${clipId}-remapped.json`;
        fs.writeFileSync(path.join(PUBLIC_DIR, captionsFilename), JSON.stringify(clipCaptions, null, 2));

        await db.update(clips).set({
          gapEditedPath: editedVideoPath, // all shorts share the edited master
          clipCaptionsPath: `public/${captionsFilename}`,
          removedIntervals: [],           // no per-short edit; video already clean
          updatedAt: new Date(),
        }).where(eq(clips.id, clipId));

        console.log(`[analyzeLongform] Short ${i + 1}: "${suggestion.title}" — ${clipCaptions.length} caption words`);
        emitJobEvent(jobId, { type: "progress", message: `✓ Short ${i + 1}/${shortObj.clips.length}: "${suggestion.title}"` });

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[analyzeLongform] Short ${i + 1} caption slice failed: ${message}`);
        await db.update(clips).set({ status: "error", errorMessage: message, updatedAt: new Date() }).where(eq(clips.id, clipId));
        emitJobEvent(jobId, { type: "progress", message: `⚠ Short ${i + 1} failed: ${message}` });
      }
    }

    // ── Phase 7: Ready for review ─────────────────────────────────────────────
    await db.update(jobs).set({ status: "stage1_review", updatedAt: new Date() }).where(eq(jobs.id, jobId));
    console.log(`[analyzeLongform] Job ${jobId} ready for review`);

    emitJobEvent(jobId, {
      type: "status",
      status: "stage1_review",
      message: `Analysis complete. ${sectionObj.sections.length} sections + ${shortObj.clips.length} shorts ready.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyzeLongform] Fatal error:", message);
    await db.update(jobs).set({ status: "error", errorMessage: message, updatedAt: new Date() }).where(eq(jobs.id, jobId));
    emitJobEvent(jobId, { type: "error", message });
    throw err;
  }
}
