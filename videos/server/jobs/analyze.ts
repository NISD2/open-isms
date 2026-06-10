import { createXai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { jobs, clips } from "../schema";
import { eq } from "drizzle-orm";
import { emitJobEvent } from "./queue";
import { transcribeClipSegments, transcribeFullVideo, buildTranscriptFromCaptions } from "./transcribeClip";
import { grokEditClip } from "./grokEdit";
import { remapCaptions } from "../lib/remapCaptions";
import { runLongformAnalysis } from "./analyzeLongform";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");

const SegmentSchema = z.object({
  startMs: z.number().describe("Start time in milliseconds, at a sentence boundary. Use the nearest [M:SS = Nms] marker plus estimated offset."),
  endMs: z.number().describe("End time in milliseconds, at a sentence boundary. Must be after startMs."),
});

const ClipSuggestionSchema = z.object({
  clips: z
    .array(
      z.object({
        title: z.string().describe("Short punchy title for LinkedIn/YouTube Shorts (under 60 chars). Can be a direct quote, bold claim, or question."),
        rationale: z.string().describe("2-3 sentences: what the clip is about, why it works standalone, and the viewer takeaway."),
        segments: z
          .array(SegmentSchema)
          .min(1)
          .max(4)
          .describe("1-4 time ranges to stitch together with hard cuts. Use multiple segments to combine a topic mentioned early and revisited later, or to skip dead air between two good moments."),
        totalDurationSeconds: z.number().describe("Sum of all segment durations in seconds. Must be between 30 and 90."),
      })
    )
    .min(2)
    .max(6),
});

export async function runAnalysis(jobId: string): Promise<void> {
  console.log(`[analyze] Starting analysis for job: ${jobId}`);
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));

  if (!job) throw new Error(`Job ${jobId} not found`);

  // Dispatch to longform pipeline when no transcript was uploaded
  if (job.mode === "longform") {
    return runLongformAnalysis(jobId);
  }

  try {
    await db.update(jobs).set({ status: "analyzing", updatedAt: new Date() }).where(eq(jobs.id, jobId));

    // If no Gemini transcript was uploaded, run Whisper on the full video to generate one
    let transcriptText = job.transcriptText;
    if (!transcriptText) {
      emitJobEvent(jobId, { type: "status", status: "analyzing", message: "No transcript — running Whisper on full video..." });
      console.log("[analyze] No transcript found — transcribing full video with Whisper...");
      const absVideoPath = path.join(VIDEOS_DIR, job.uploadPath);
      const fullCaptions = await transcribeFullVideo(job.id, absVideoPath);
      transcriptText = buildTranscriptFromCaptions(fullCaptions);
      console.log(`[analyze] Full-video Whisper complete: ${fullCaptions.length} words, ${transcriptText.length} chars`);
      // Save so re-analyze works without re-running Whisper
      await db.update(jobs).set({ transcriptText, updatedAt: new Date() }).where(eq(jobs.id, jobId));
    } else {
      console.log(`[analyze] Transcript length: ${transcriptText.length} chars`);
    }

    emitJobEvent(jobId, { type: "status", status: "analyzing", message: "Sending transcript to Grok for clip suggestions..." });

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("XAI_API_KEY environment variable is not set");

    const xai = createXai({ apiKey });

    // ── Step 1: Grok 1 — clip suggestions ────────────────────────────────
    console.log("[analyze] Calling Grok 1 for clip suggestions...");
    const { object } = await generateObject({
      model: xai("grok-4-1-fast-reasoning"),
      schema: ClipSuggestionSchema,
      system: `You are a video editor for a NIS2 cybersecurity compliance startup called NISD2.
The founders (Simon and Cory) record their daily standup meetings and post the best moments as LinkedIn/YouTube Shorts.
Their audience is IT managers, CISOs, and business owners in EU companies who need to comply with NIS2.

WHAT MAKES A GOOD CLIP:
- Technical explanations made accessible: how risk analysis works, what counts as an incident, compliance deadlines
- Founder candor and banter: honest takes, jokes, self-deprecating moments
- Surprising or counterintuitive insights: "most companies are getting this wrong"
- Sales/outreach war stories: getting a yes, a creative cold outreach tactic that worked
- Product discovery moments: realising a gap or customer need
- Relatable founder struggles: stress, chaos, small wins

HARD RULES:
- totalDurationSeconds must be 30–90. It equals the sum of all segment durations, NOT wall-clock end-to-start.
- Each segment starts and ends at complete sentence boundaries.
- The clip must be self-contained — a stranger should understand it with no prior context.
- Use multiple segments to: stitch a topic mentioned early with its conclusion later, skip logistical filler between two strong moments, combine a question and its answer separated by tangents.
- Do NOT suggest agenda items, introductions, screen-sharing logistics, or "let me share my screen" moments.
- The Gemini transcript timestamps are approximate (±30 seconds). Use them as rough guides only.`,
      prompt: `Here is the transcript of a video recording.
Timestamps format: [M:SS = Nms] — use the ms value for startMs/endMs.
Timestamps appear every ~1 minute and are approximate (±30s accuracy).

Identify 2-5 clips for LinkedIn/YouTube Shorts.
Verify totalDurationSeconds = sum((endMs-startMs)/1000) for all segments before returning.
${job.customContext ? `\nAdditional context from the editor:\n${job.customContext}\n` : ""}
Transcript:
${transcriptText}`,
    });

    console.log(`[analyze] Grok 1 returned ${object.clips.length} clip suggestions`);
    emitJobEvent(jobId, { type: "progress", message: `Grok suggested ${object.clips.length} clips. Starting Whisper + edit pass...` });

    // ── Step 2: Insert clips, then Whisper + Grok 2 per clip ─────────────
    const absVideoPath = path.join(VIDEOS_DIR, job.uploadPath);
    const now = new Date();

    for (let i = 0; i < object.clips.length; i++) {
      const suggestion = object.clips[i];
      const clipId = crypto.randomUUID();

      await db.insert(clips).values({
        id: clipId,
        jobId,
        title: suggestion.title,
        rationale: suggestion.rationale,
        sortOrder: i,
        segments: suggestion.segments,
        status: "suggested",
        createdAt: now,
        updatedAt: now,
      });

      console.log(`[analyze] Clip ${i + 1}/${object.clips.length}: "${suggestion.title}"`);
      emitJobEvent(jobId, { type: "progress", message: `Clip ${i + 1}/${object.clips.length}: transcribing "${suggestion.title}"...` });

      try {
        // Whisper — word-level timestamps for this clip's segments
        console.log(`[analyze] Clip ${i + 1}: running Whisper on ${suggestion.segments.length} segment(s)...`);
        const { captions } = await transcribeClipSegments(clipId, absVideoPath, suggestion.segments);
        console.log(`[analyze] Clip ${i + 1}: Whisper returned ${captions.length} words`);

        emitJobEvent(jobId, { type: "progress", message: `Clip ${i + 1}/${object.clips.length}: Grok editing "${suggestion.title}"...` });

        // Grok 2 — edit decisions using word-level captions + title + rationale
        console.log(`[analyze] Clip ${i + 1}: calling Grok 2 for edit decisions...`);
        const { removedIntervals, outputFilename: gapEditedFilename } = await grokEditClip({
          clipId,
          absInputPath: absVideoPath,
          segments: suggestion.segments,
          captions,
          title: suggestion.title,
          rationale: suggestion.rationale,
        });
        console.log(`[analyze] Clip ${i + 1}: Grok 2 flagged ${removedIntervals.length} intervals, ffmpeg cut complete`);

        // Caption remap — adjust timestamps to match gap-edited video (PTS 0)
        const structuralRemovals: { startMs: number; endMs: number }[] = [];
        if (suggestion.segments[0].startMs > 0) {
          structuralRemovals.push({ startMs: 0, endMs: suggestion.segments[0].startMs });
        }
        for (let j = 0; j < suggestion.segments.length - 1; j++) {
          structuralRemovals.push({ startMs: suggestion.segments[j].endMs, endMs: suggestion.segments[j + 1].startMs });
        }
        const allRemovals = [...structuralRemovals, ...removedIntervals];
        const remapped = remapCaptions(captions, allRemovals);
        const remappedFilename = `captions-${clipId}-remapped.json`;
        fs.writeFileSync(path.join(PUBLIC_DIR, remappedFilename), JSON.stringify(remapped, null, 2));
        console.log(`[analyze] Clip ${i + 1}: captions remapped, ${remapped.length} words`);

        await db.update(clips).set({
          gapEditedPath: `public/${gapEditedFilename}`,
          clipCaptionsPath: `public/${remappedFilename}`,
          removedIntervals,
          updatedAt: new Date(),
        }).where(eq(clips.id, clipId));

        emitJobEvent(jobId, { type: "progress", message: `✓ Clip ${i + 1}/${object.clips.length}: "${suggestion.title}" ready` });

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[analyze] Clip ${i + 1} processing failed: ${message}`);
        // Mark clip as error but continue with remaining clips
        await db.update(clips).set({ status: "error", errorMessage: message, updatedAt: new Date() }).where(eq(clips.id, clipId));
        emitJobEvent(jobId, { type: "progress", message: `⚠ Clip ${i + 1} processing failed: ${message}` });
      }
    }

    // ── Step 3: Set job to stage1_review ─────────────────────────────────
    await db.update(jobs).set({ status: "stage1_review", updatedAt: new Date() }).where(eq(jobs.id, jobId));
    console.log(`[analyze] Job ${jobId} ready for review`);

    emitJobEvent(jobId, {
      type: "status",
      status: "stage1_review",
      message: `Analysis complete. ${object.clips.length} clips ready for review.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze] Fatal error:", message);
    await db.update(jobs).set({ status: "error", errorMessage: message, updatedAt: new Date() }).where(eq(jobs.id, jobId));
    emitJobEvent(jobId, { type: "error", message });
    throw err;
  }
}
