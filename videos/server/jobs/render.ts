import path from "path";
import fs from "fs";
import { db } from "../db";
import { jobs, clips, sections } from "../schema";
import { eq, and } from "drizzle-orm";
import { emitJobEvent } from "./queue";
import { transcribeClipSegments } from "./transcribeClip";
import { grokEditClip } from "./grokEdit";
import { remapCaptions } from "../lib/remapCaptions";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");
const OUT_DIR = path.join(VIDEOS_DIR, "out");

/**
 * Runs Whisper + Grok 2 + ffmpeg + caption remap for a clip.
 * Called during render when a clip has been re-edited and its processed files were cleared.
 */
async function prepareClip(clip: typeof clips.$inferSelect, absVideoPath: string, jobId: string): Promise<void> {
  const label = `[render:"${clip.title.slice(0, 30)}"]`;
  const segments = clip.segments as { startMs: number; endMs: number }[];

  emitJobEvent(jobId, { type: "progress", message: `Re-processing "${clip.title}" (segments changed)...` });

  console.log(`${label} Re-processing: Whisper + Grok 2 + ffmpeg`);
  const { captions } = await transcribeClipSegments(clip.id, absVideoPath, segments);
  console.log(`${label} Whisper: ${captions.length} words`);

  const { removedIntervals, outputFilename: gapEditedFilename } = await grokEditClip({
    clipId: clip.id,
    absInputPath: absVideoPath,
    segments,
    captions,
    title: clip.title,
    rationale: clip.rationale ?? "",
  });
  console.log(`${label} Grok 2: ${removedIntervals.length} intervals removed`);

  const structuralRemovals: { startMs: number; endMs: number }[] = [];
  if (segments[0].startMs > 0) {
    structuralRemovals.push({ startMs: 0, endMs: segments[0].startMs });
  }
  for (let i = 0; i < segments.length - 1; i++) {
    structuralRemovals.push({ startMs: segments[i].endMs, endMs: segments[i + 1].startMs });
  }
  const remapped = remapCaptions(captions, [...structuralRemovals, ...removedIntervals]);
  const remappedFilename = `captions-${clip.id}-remapped.json`;
  fs.writeFileSync(path.join(PUBLIC_DIR, remappedFilename), JSON.stringify(remapped, null, 2));

  await db.update(clips).set({
    gapEditedPath: `public/${gapEditedFilename}`,
    clipCaptionsPath: `public/${remappedFilename}`,
    removedIntervals,
    updatedAt: new Date(),
  }).where(eq(clips.id, clip.id));

  // Reload updated values into the clip object for the caller
  Object.assign(clip, {
    gapEditedPath: `public/${gapEditedFilename}`,
    clipCaptionsPath: `public/${remappedFilename}`,
    removedIntervals,
  });
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function todayDir(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolveOutputPath(outputDir: string, slug: string): { absPath: string; relPath: string } {
  if (!fs.existsSync(path.join(outputDir, `${slug}.mp4`))) {
    return { absPath: path.join(outputDir, `${slug}.mp4`), relPath: `${slug}.mp4` };
  }
  let v = 2;
  while (fs.existsSync(path.join(outputDir, `${slug}-v${v}.mp4`))) v++;
  return { absPath: path.join(outputDir, `${slug}-v${v}.mp4`), relPath: `${slug}-v${v}.mp4` };
}

export async function renderClip(jobId: string, clipId: string): Promise<void> {
  const [clip] = await db.select().from(clips).where(eq(clips.id, clipId));
  if (!clip) throw new Error(`Clip ${clipId} not found`);

  const label = `[render:"${clip.title.slice(0, 30)}"]`;

  try {
    await db.update(clips).set({ status: "rendering", updatedAt: new Date() }).where(eq(clips.id, clipId));

    // Re-edited clips have cleared gapEditedPath/clipCaptionsPath — process them now
    if (!clip.gapEditedPath || !clip.clipCaptionsPath) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
      if (!job) throw new Error(`Job ${jobId} not found`);
      await prepareClip(clip, path.join(VIDEOS_DIR, job.uploadPath), jobId);
    }

    const dateDir = todayDir();
    const slug = toSlug(clip.title);
    const outputDir = path.join(OUT_DIR, dateDir);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const { absPath: outputPath, relPath: outputFilename } = resolveOutputPath(outputDir, slug);

    if (!clip.gapEditedPath || !clip.clipCaptionsPath) {
      throw new Error(`Clip "${clip.title}" still has no processed files after prepare step`);
    }

    const segments = clip.segments as { startMs: number; endMs: number }[];
    const gapEditedFilename = path.basename(clip.gapEditedPath);
    const captionsFilename = path.basename(clip.clipCaptionsPath);

    // Longform clips reference the edited master — pass actual segments for trimBefore/trimAfter.
    // Daily clips have their own gap-edited video starting at 0 — use [{0, totalDurationMs}].
    const isLongformClip = gapEditedFilename.startsWith("edited-");
    let remotionSegments: { startMs: number; endMs: number }[];
    if (isLongformClip) {
      remotionSegments = segments;
    } else {
      const removedIntervals = (clip.removedIntervals ?? []) as { startMs: number; endMs: number }[];
      const totalOriginalMs = segments.reduce((acc: number, s: { startMs: number; endMs: number }) => acc + (s.endMs - s.startMs), 0);
      const removedMs = removedIntervals.reduce((acc: number, r: { startMs: number; endMs: number }) => acc + (r.endMs - r.startMs), 0);
      const totalDurationMs = Math.max(totalOriginalMs - removedMs, 1000);
      remotionSegments = [{ startMs: 0, endMs: totalDurationMs }];
    }

    const props = JSON.stringify({
      videoSrc: gapEditedFilename,
      captionsFile: captionsFilename,
      segments: remotionSegments,
    });

    const totalDurationMs = remotionSegments.reduce((acc, s) => acc + (s.endMs - s.startMs), 0);
    console.log(`${label} Remotion render → ${outputPath}`);
    console.log(`${label} Duration: ${Math.round(totalDurationMs / 1000)}s | captions: ${captionsFilename}`);
    emitJobEvent(jobId, { type: "progress", message: `Rendering "${clip.title}" (${Math.round(totalDurationMs / 1000)}s)...` });

    const proc = Bun.spawn(
      [
        "bunx", "remotion", "render", "PipelineMultiClip",
        outputPath,
        "--props", props,
        "--concurrency", "4",
      ],
      { cwd: VIDEOS_DIR, stdout: "pipe", stderr: "pipe" }
    );

    const decoder = new TextDecoder();
    const reader = proc.stdout.getReader();
    let lastReportedPct = -1;
    (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const pctMatch = trimmed.match(/\b(\d+)%/);
          const hasFraction = /\d+\/\d+/.test(trimmed);
          if (pctMatch && hasFraction) {
            const pct = parseInt(pctMatch[1], 10);
            const milestone = Math.floor(pct / 10) * 10;
            if (milestone > lastReportedPct) {
              lastReportedPct = milestone;
              const msg = `${milestone}% rendered`;
              console.log(`${label} ${msg}`);
              emitJobEvent(jobId, { type: "progress", message: msg });
            }
          } else {
            console.log(`${label} ${trimmed}`);
            emitJobEvent(jobId, { type: "progress", message: trimmed });
          }
        }
      }
    })();

    const exitCode = await proc.exited;

    if (exitCode === 0) {
      await db.update(clips).set({
        status: "done",
        slug,
        outputPath: `out/${dateDir}/${outputFilename}`,
        updatedAt: new Date(),
      }).where(eq(clips.id, clipId));
      const msg = `✓ Rendered: out/${dateDir}/${outputFilename}`;
      console.log(`${label} ${msg}`);
      emitJobEvent(jobId, { type: "progress", message: msg });
    } else {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(stderr.slice(-500));
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${label} FAILED: ${message}`);
    await db.update(clips).set({ status: "error", errorMessage: message, updatedAt: new Date() }).where(eq(clips.id, clipId));
    emitJobEvent(jobId, { type: "error", message: `"${clip.title}" failed: ${message}` });
  }
}

export async function renderLongform(jobId: string): Promise<void> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (!job.editedVideoPath || !job.editedCaptionsPath) {
    throw new Error("Job has no edited video — run analysis first");
  }

  const label = `[render:longform-${jobId.slice(0, 8)}]`;

  try {
    await db.update(jobs).set({ status: "rendering", updatedAt: new Date() }).where(eq(jobs.id, jobId));
    emitJobEvent(jobId, { type: "status", status: "rendering", message: "Rendering 16:9 YouTube video..." });

    const includedSections = await db
      .select()
      .from(sections)
      .where(and(eq(sections.jobId, jobId), eq(sections.included, true)));

    // Read edited captions to determine video duration
    const captionsAbsPath = path.join(VIDEOS_DIR, job.editedCaptionsPath);
    const editedCaptions: { startMs: number; endMs: number }[] = JSON.parse(fs.readFileSync(captionsAbsPath, "utf-8"));
    const durationMs = editedCaptions.length > 0
      ? Math.max(...editedCaptions.map((c) => c.endMs)) + 500
      : 60000;

    const dateDir = todayDir();
    const slug = toSlug(job.originalFilename.replace(/\.[^.]+$/, ""));
    const outputDir = path.join(OUT_DIR, dateDir);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const { absPath: outputPath, relPath: outputFilename } = resolveOutputPath(outputDir, slug);

    const sortedSections = [...includedSections].sort((a, b) => a.sortOrder - b.sortOrder);

    const props = JSON.stringify({
      videoSrc: path.basename(job.editedVideoPath),
      captionsFile: path.basename(job.editedCaptionsPath),
      sections: sortedSections.map((s) => ({
        title: s.title,
        subtitle: s.subtitle ?? undefined,
        startMs: s.startMs,
        endMs: s.endMs,
      })),
      durationMs,
    });

    console.log(`${label} Remotion render → ${outputPath}`);
    console.log(`${label} Duration: ${Math.round(durationMs / 1000)}s, ${sortedSections.length} sections`);
    emitJobEvent(jobId, { type: "progress", message: `Rendering 16:9 (${Math.round(durationMs / 1000)}s, ${sortedSections.length} sections)...` });

    const proc = Bun.spawn(
      [
        "bunx", "remotion", "render", "PipelineLongform",
        outputPath,
        "--props", props,
        "--concurrency", "4",
      ],
      { cwd: VIDEOS_DIR, stdout: "pipe", stderr: "pipe" }
    );

    const decoder = new TextDecoder();
    const reader = proc.stdout.getReader();
    let lastReportedPct = -1;
    (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const pctMatch = trimmed.match(/\b(\d+)%/);
          const hasFraction = /\d+\/\d+/.test(trimmed);
          if (pctMatch && hasFraction) {
            const pct = parseInt(pctMatch[1], 10);
            const milestone = Math.floor(pct / 10) * 10;
            if (milestone > lastReportedPct) {
              lastReportedPct = milestone;
              const msg = `${milestone}% rendered`;
              console.log(`${label} ${msg}`);
              emitJobEvent(jobId, { type: "progress", message: msg });
            }
          } else {
            console.log(`${label} ${trimmed}`);
            emitJobEvent(jobId, { type: "progress", message: trimmed });
          }
        }
      }
    })();

    const exitCode = await proc.exited;

    if (exitCode === 0) {
      await db.update(jobs).set({
        status: "done",
        outputDateDir: dateDir,
        updatedAt: new Date(),
      }).where(eq(jobs.id, jobId));
      const msg = `✓ Rendered: out/${dateDir}/${outputFilename}`;
      console.log(`${label} ${msg}`);
      emitJobEvent(jobId, { type: "progress", message: msg });
      emitJobEvent(jobId, { type: "status", status: "done", message: "16:9 video rendered." });
      emitJobEvent(jobId, { type: "done" });
    } else {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(stderr.slice(-500));
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${label} FAILED: ${message}`);
    await db.update(jobs).set({ status: "error", errorMessage: message, updatedAt: new Date() }).where(eq(jobs.id, jobId));
    emitJobEvent(jobId, { type: "error", message });
  }
}

export async function renderApprovedClips(jobId: string): Promise<number> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) throw new Error(`Job ${jobId} not found`);

  const approvedClips = await db.select().from(clips)
    .where(and(eq(clips.jobId, jobId), eq(clips.status, "stage1_approved")));

  if (approvedClips.length === 0) return 0;

  console.log(`[render] Starting ${approvedClips.length} Remotion render(s) for job ${jobId}`);
  await db.update(jobs).set({ status: "rendering", updatedAt: new Date() }).where(eq(jobs.id, jobId));
  emitJobEvent(jobId, { type: "status", status: "rendering", message: `Rendering ${approvedClips.length} clip(s)...` });

  for (const clip of approvedClips) {
    await renderClip(jobId, clip.id);
  }

  console.log(`[render] All clips done for job ${jobId}`);
  await db.update(jobs).set({ status: "done", updatedAt: new Date() }).where(eq(jobs.id, jobId));
  emitJobEvent(jobId, { type: "status", status: "done", message: "All clips rendered." });
  emitJobEvent(jobId, { type: "done" });

  return approvedClips.length;
}
