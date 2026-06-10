import { createXai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";
import path from "path";
import { execSync } from "child_process";
import type { Caption, RemovedInterval } from "../lib/remapCaptions";
import type { ClipSegment } from "../schema";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");

const RemovalSchema = z.object({
  clipAssessment: z.string().describe("2-3 sentences: what is the meaningful content of this clip, what is the key insight or moment, and what must be preserved to keep that value intact. This guides your cut decisions."),
  removals: z.array(
    z.object({
      startMs: z.number().int().describe("Start of section to remove, in milliseconds"),
      endMs: z.number().int().describe("End of section to remove, in milliseconds"),
      reason: z.string().describe("One sentence explaining exactly what is being cut and why (e.g. 'Isolated filler sound \"um\" before main point' or 'False start: speaker restates opening word'). Be specific — vague reasons like \"filler\" are not acceptable."),
    })
  ).describe("Time intervals to cut from the clip. Must be at word boundaries from the transcript."),
});

function mergeIntervals(intervals: RemovedInterval[]): RemovedInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.startMs - b.startMs);
  const merged: RemovedInterval[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].startMs <= last.endMs + 50) {
      last.endMs = Math.max(last.endMs, sorted[i].endMs);
    } else {
      merged.push({ ...sorted[i] });
    }
  }
  return merged;
}

/**
 * Builds a human-readable word list for Grok, grouped by segment.
 * Includes pause durations between consecutive words so Grok can identify dead air.
 */
function buildWordList(segments: ClipSegment[], captions: Caption[]): string {
  const lines: string[] = [];

  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si];
    const words = captions.filter(
      (c) => c.startMs >= seg.startMs && c.endMs <= seg.endMs
    );

    lines.push(`Segment ${si + 1} [${seg.startMs}ms – ${seg.endMs}ms]:`);

    for (let wi = 0; wi < words.length; wi++) {
      const w = words[wi];
      lines.push(`  [${w.startMs}-${w.endMs}] "${w.text}"`);

      // Show gap to next word so Grok can judge silences
      // Only flag pauses >500ms — shorter gaps are natural breathing room in conversation
      const next = words[wi + 1];
      if (next) {
        const gap = next.startMs - w.endMs;
        if (gap > 500) lines.push(`  <pause ${gap}ms>`);
      }
    }

    // Trailing silence after last word in segment
    const lastWord = words[words.length - 1];
    if (lastWord) {
      const trailing = seg.endMs - lastWord.endMs;
      if (trailing > 500) lines.push(`  <trailing silence ${trailing}ms>`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Runs Grok on the full video to remove fillers/dead air for a clean longform YouTube edit.
 * Treats the entire video as one segment. Outputs public/edited-{jobId}.mp4.
 */
export async function grokEditFullVideo(params: {
  jobId: string;
  absInputPath: string;
  durationMs: number;
  captions: Caption[];
}): Promise<{ removedIntervals: RemovedInterval[]; outputFilename: string }> {
  const { jobId, absInputPath, durationMs, captions } = params;

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not set");

  const segments: ClipSegment[] = [{ startMs: 0, endMs: durationMs }];
  const wordList = buildWordList(segments, captions);
  const xai = createXai({ apiKey });

  console.log(`[grokEdit:longform-${jobId.slice(0, 8)}] Sending ${captions.length} words to Grok for full-video edit...`);

  const { object } = await generateObject({
    model: xai("grok-4-1-fast-reasoning"),
    schema: RemovalSchema,
    system: `You are a professional video editor for a NIS2 cybersecurity YouTube channel.
You receive a word-by-word transcript of a 5–10 minute talking-head video with millisecond timestamps.
Your job: return the millisecond intervals to cut to produce a clean, tight YouTube video.

REMOVE:
- Filler sounds used without meaning: "um", "uh", "uhh", "hmm" — always cut
- Filler words as verbal tics: "like", "so", "right", "you know" — ONLY cut when used as pause fillers, not when they carry meaning
- False starts: "we — we need to" → cut the first "we"
- Repetitive restatements of the same point in the same breath
- Dead air and awkward pauses (shown as <pause Nms>) that don't add emphasis or dramatic effect
- Trailing silence at the end

KEEP:
- "like" when used for comparison ("it's like a firewall for...")
- "so" as a logical connector ("so that means we need to...")
- "right" as a genuine affirmation at the end of a point
- Natural pauses before key statements — they build emphasis
- Pauses between topic transitions — these help section changes feel clear
- The speaker's authentic rhythm and voice

Return intervals at exact word boundaries from the transcript. Do not cut mid-word.
When in doubt, keep it — over-cutting is worse than under-cutting.`,
    prompt: `This is a NIS2 cybersecurity YouTube video. Edit for maximum clarity and flow.

Word-by-word transcript with timestamps:
${wordList}

Return the intervals to remove.`,
  });

  const validRemovals = object.removals.filter(
    (r) => r.startMs < r.endMs && r.endMs > 0 && r.startMs < durationMs
  );
  const removedIntervals = mergeIntervals(validRemovals);
  console.log(`[grokEdit:longform-${jobId.slice(0, 8)}] Assessment: ${object.clipAssessment}`);
  console.log(`[grokEdit:longform-${jobId.slice(0, 8)}] ${removedIntervals.length} intervals flagged`);
  for (const r of validRemovals) {
    console.log(`[grokEdit:longform-${jobId.slice(0, 8)}]   ${r.startMs}–${r.endMs}ms: ${r.reason}`);
  }

  // Build keep windows for the full video
  const keepWindows: { startMs: number; endMs: number }[] = [];
  let cursor = 0;
  for (const removed of removedIntervals) {
    if (removed.startMs >= durationMs) break;
    if (cursor < removed.startMs) keepWindows.push({ startMs: cursor, endMs: removed.startMs });
    cursor = Math.max(cursor, removed.endMs);
  }
  if (cursor < durationMs) keepWindows.push({ startMs: cursor, endMs: durationMs });

  if (keepWindows.length === 0) {
    throw new Error("Grok full-video edit produced no keep windows");
  }

  const filters: string[] = [];
  for (let i = 0; i < keepWindows.length; i++) {
    const s = keepWindows[i].startMs / 1000;
    const e = keepWindows[i].endMs / 1000;
    filters.push(`[0:v]trim=start=${s}:end=${e},setpts=PTS-STARTPTS[v${i}]`);
    filters.push(`[0:a]atrim=start=${s}:end=${e},asetpts=PTS-STARTPTS[a${i}]`);
  }
  const concatInputs = keepWindows.map((_, i) => `[v${i}][a${i}]`).join("");
  const filterComplex = `${filters.join(";")};${concatInputs}concat=n=${keepWindows.length}:v=1:a=1[outv][outa]`;

  const outputFilename = `edited-${jobId}.mp4`;
  const outputPath = path.join(PUBLIC_DIR, outputFilename);

  execSync(
    `ffmpeg -i "${absInputPath}" -filter_complex "${filterComplex}" -map "[outv]" -map "[outa]" "${outputPath}" -y`,
    { stdio: "pipe" }
  );

  return { removedIntervals, outputFilename };
}

export async function grokEditClip(params: {
  clipId: string;
  absInputPath: string;
  segments: ClipSegment[];
  captions: Caption[];
  title: string;
  rationale: string;
}): Promise<{ removedIntervals: RemovedInterval[]; outputFilename: string }> {
  const { clipId, absInputPath, segments, captions, title, rationale } = params;

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not set");

  const wordList = buildWordList(segments, captions);
  const xai = createXai({ apiKey });

  console.log(`[grokEdit:${clipId.slice(0, 8)}] Sending ${captions.length} words to Grok for edit decisions...`);

  const { object } = await generateObject({
    model: xai("grok-4-1-fast-reasoning"),
    schema: RemovalSchema,
    system: `You are a professional video editor specialising in short-form social media clips (LinkedIn, YouTube Shorts).
You receive a word-by-word transcript with millisecond timestamps, grouped by segment. Only pauses >500ms are shown — shorter gaps are normal breathing room and should NOT be cut.
Your job: return the exact millisecond intervals to cut to produce a clean, natural-sounding clip.

THIS IS A CONVERSATION between two people. Treat it accordingly:
- Short responses ("Yeah.", "Right.", "Mhm.", "Okay.") are part of the dialogue — keep them unless they appear 3+ times in a row as pure dead air
- Cross-talk and short back-and-forth are natural — do not cut conversational rhythm
- Pauses shown in the transcript are already >500ms — only cut the ones that feel like awkward dead air, not natural thinking pauses

REMOVE (only these):
- Filler sounds without meaning: "um", "uh", "uhh", "hmm" — cut when isolated, not when mid-thought
- False starts: "we — we need to" → cut only the false start word(s)
- Trailing silence at the very end of the clip (<trailing silence Nms>)
- True dead air: pauses >1000ms with no semantic purpose

KEEP EVERYTHING ELSE. Specifically:
- "like", "so", "right", "you know" — keep unless they are clearly pure filler with no surrounding meaning
- Natural thinking pauses — they make the speaker sound human, not robotic
- The speaker's authentic pace and rhythm
- Any word or phrase that carries meaning, even marginally

GOAL: smooth, natural flow — NOT maximum density. A clip with 2 clean cuts sounds better than one with 12 jarring micro-cuts. Prefer 0 cuts over a cut that creates an unnatural jump.
If the clip is already clean, return an empty removals list.

Return intervals at exact word boundaries. Do not cut mid-word.`,
    prompt: `Clip title: "${title}"
${rationale ? `Context: ${rationale}\n` : ""}
Word-by-word transcript with timestamps:
${wordList}
Return only the intervals that genuinely need cutting. When in doubt, leave it in.`,
  });

  // Clamp intervals to segment bounds and validate
  const allSegStart = segments[0].startMs;
  const allSegEnd = segments[segments.length - 1].endMs;
  const validRemovals = object.removals.filter(
    (r) => r.startMs < r.endMs && r.endMs > allSegStart && r.startMs < allSegEnd
  );

  const removedIntervals = mergeIntervals(validRemovals);
  console.log(`[grokEdit:${clipId.slice(0, 8)}] Assessment: ${object.clipAssessment}`);
  console.log(`[grokEdit:${clipId.slice(0, 8)}] Grok flagged ${removedIntervals.length} intervals to remove`);
  for (const r of validRemovals) {
    console.log(`[grokEdit:${clipId.slice(0, 8)}]   ${r.startMs}–${r.endMs}ms: ${r.reason}`);
  }

  // Build keep windows from segments minus removed intervals
  const keepWindows: { startMs: number; endMs: number }[] = [];
  for (const seg of segments) {
    let cursor = seg.startMs;
    for (const removed of removedIntervals) {
      if (removed.startMs >= seg.endMs) break;
      if (removed.endMs <= seg.startMs) continue;
      const removeStart = Math.max(removed.startMs, seg.startMs);
      const removeEnd = Math.min(removed.endMs, seg.endMs);
      if (cursor < removeStart) {
        keepWindows.push({ startMs: cursor, endMs: removeStart });
      }
      cursor = removeEnd;
    }
    if (cursor < seg.endMs) {
      keepWindows.push({ startMs: cursor, endMs: seg.endMs });
    }
  }

  if (keepWindows.length === 0) {
    throw new Error("Grok edit produced no keep windows — all content would be removed");
  }

  // ffmpeg filter_complex: trim each keep window + concat
  const filters: string[] = [];
  for (let i = 0; i < keepWindows.length; i++) {
    const s = keepWindows[i].startMs / 1000;
    const e = keepWindows[i].endMs / 1000;
    filters.push(`[0:v]trim=start=${s}:end=${e},setpts=PTS-STARTPTS[v${i}]`);
    filters.push(`[0:a]atrim=start=${s}:end=${e},asetpts=PTS-STARTPTS[a${i}]`);
  }
  const concatInputs = keepWindows.map((_, i) => `[v${i}][a${i}]`).join("");
  const filterComplex = `${filters.join(";")};${concatInputs}concat=n=${keepWindows.length}:v=1:a=1[outv][outa]`;

  const outputFilename = `gap-edited-${clipId}.mp4`;
  const outputPath = path.join(PUBLIC_DIR, outputFilename);

  execSync(
    `ffmpeg -i "${absInputPath}" -filter_complex "${filterComplex}" -map "[outv]" -map "[outa]" "${outputPath}" -y`,
    { stdio: "pipe" }
  );

  return { removedIntervals, outputFilename };
}
