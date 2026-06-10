import path from "path";
import { db } from "../db";
import { jobs, clips } from "../schema";
import { eq, and } from "drizzle-orm";
import { emitJobEvent, enqueueTranscription } from "./queue";
import { transcribeClipSegments } from "./transcribeClip";
import { gapEditClip } from "./gapEdit";
import { remapCaptions } from "../lib/remapCaptions";
import { renderPreview } from "./renderPreview";
import fs from "fs";
import path2 from "path";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");

export async function processClip(clipId: string, jobId: string, absVideoPath: string): Promise<void> {
  const [clip] = await db.select().from(clips).where(eq(clips.id, clipId));
  if (!clip) throw new Error(`Clip ${clipId} not found`);

  try {
    await db.update(clips).set({ status: "processing", updatedAt: new Date() }).where(eq(clips.id, clipId));
    emitJobEvent(jobId, { type: "progress", message: `Processing clip: "${clip.title}"` });

    // Step 1: Whisper on trimmed windows
    emitJobEvent(jobId, { type: "progress", message: `Transcribing segments for "${clip.title}"...` });
    const { captions } = await transcribeClipSegments(clipId, absVideoPath, clip.segments);

    // Step 2: Gap edit
    emitJobEvent(jobId, { type: "progress", message: `Removing filler words and gaps...` });
    const { removedIntervals, outputFilename: gapEditedFilename } = await gapEditClip({
      clipId,
      absInputPath: absVideoPath,
      segments: clip.segments,
      captions,
    });

    // Step 3: Remap captions to new timeline
    //
    // remapCaptions only subtracts filler/silence intervals. But the gap-edited
    // video starts at PTS 0, while captions are in the original video timeline
    // (e.g. a clip from 5:00 has timestamps starting at ~300000ms).
    //
    // We must also account for:
    //   a) the offset before the first segment (e.g. 300000ms of video before clip starts)
    //   b) gaps between segments (content not included in the clip)
    //
    // Adding these as additional removed intervals means remapCaptions normalises
    // all timestamps to start at 0, matching the gap-edited video's PTS.
    const segments = clip.segments as { startMs: number; endMs: number }[];
    const structuralRemovals: { startMs: number; endMs: number }[] = [];

    // a) Everything before the first segment
    if (segments[0].startMs > 0) {
      structuralRemovals.push({ startMs: 0, endMs: segments[0].startMs });
    }
    // b) Gaps between consecutive segments
    for (let i = 0; i < segments.length - 1; i++) {
      structuralRemovals.push({ startMs: segments[i].endMs, endMs: segments[i + 1].startMs });
    }

    const allRemovals = [...structuralRemovals, ...removedIntervals];
    const remapped = remapCaptions(captions, allRemovals);
    const remappedFilename = `captions-${clipId}-remapped.json`;
    fs.writeFileSync(path2.join(PUBLIC_DIR, remappedFilename), JSON.stringify(remapped, null, 2));

    // Step 4: Calculate total duration of gap-edited clip
    const totalOriginalMs = clip.segments.reduce((acc, s) => acc + (s.endMs - s.startMs), 0);
    const removedMs = removedIntervals.reduce((acc, r) => acc + (r.endMs - r.startMs), 0);
    const totalDurationMs = Math.max(totalOriginalMs - removedMs, 1000);

    // Step 5: Preview render
    const previewPath = await renderPreview({
      clipId,
      jobId,
      gapEditedFilename,
      captionsFilename: remappedFilename,
      totalDurationMs,
    });

    // Step 6: Update clip
    await db.update(clips).set({
      status: "stage2_review",
      gapEditedPath: `public/${gapEditedFilename}`,
      previewPath,
      clipCaptionsPath: `public/${remappedFilename}`,
      updatedAt: new Date(),
    }).where(eq(clips.id, clipId));

    emitJobEvent(jobId, { type: "progress", message: `✓ Clip "${clip.title}" ready for preview.` });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.update(clips).set({ status: "error", errorMessage: message, updatedAt: new Date() }).where(eq(clips.id, clipId));
    emitJobEvent(jobId, { type: "error", message: `Clip "${clip.title}" failed: ${message}` });
  }
}

export async function processApprovedClips(jobId: string): Promise<void> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) throw new Error(`Job ${jobId} not found`);

  const absVideoPath = path.join(VIDEOS_DIR, job.uploadPath);

  const approvedClips = await db.select().from(clips)
    .where(and(eq(clips.jobId, jobId), eq(clips.status, "stage1_approved")));

  if (approvedClips.length === 0) return;

  await db.update(jobs).set({ status: "processing", updatedAt: new Date() }).where(eq(jobs.id, jobId));
  emitJobEvent(jobId, { type: "status", status: "processing", message: `Processing ${approvedClips.length} clip(s)...` });

  for (const clip of approvedClips) {
    await processClip(clip.id, jobId, absVideoPath);
  }

  // Check if all clips are now in stage2_review (none still processing/error)
  const remaining = await db.select().from(clips)
    .where(and(eq(clips.jobId, jobId), eq(clips.status, "stage1_approved")));

  if (remaining.length === 0) {
    await db.update(jobs).set({ status: "stage2_review", updatedAt: new Date() }).where(eq(jobs.id, jobId));
    emitJobEvent(jobId, { type: "status", status: "stage2_review", message: "All clips processed. Ready for Stage 2 review." });
  }
}

export function enqueueProcessing(jobId: string): void {
  enqueueTranscription(async () => {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (!job) return;
    await processApprovedClips(jobId);
  });
}
