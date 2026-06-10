import path from "path";
import { execSync } from "child_process";
import type { Caption, RemovedInterval } from "../lib/remapCaptions";
import type { ClipSegment } from "../schema";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");

const FILLER_WORDS = new Set([
  "um", "uh", "uhh", "umm", "uh-huh", "like", "so", "right", "you know",
]);

// Only cut when standalone (surrounded by silence > 300ms on both sides)
const CONTEXTUAL_FILLERS = new Set(["yeah", "okay"]);

const GAP_THRESHOLD_MS = 400;

function isContextualFiller(word: Caption, prev: Caption | undefined, next: Caption | undefined): boolean {
  const gapBefore = prev ? word.startMs - prev.endMs : 9999;
  const gapAfter = next ? next.startMs - word.endMs : 9999;
  return gapBefore > 300 && gapAfter > 300;
}

function mergeIntervals(intervals: RemovedInterval[]): RemovedInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.startMs - b.startMs);
  const merged: RemovedInterval[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].startMs <= last.endMs + 50) {
      last.endMs = Math.max(last.endMs, sorted[i].endMs);
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

/**
 * Gap-edits a video by removing filler words and long silences.
 * Only processes captions within the given segments.
 * Outputs to public/gap-edited-{clipId}.mp4
 */
export async function gapEditClip(params: {
  clipId: string;
  absInputPath: string;
  segments: ClipSegment[];
  captions: Caption[];
}): Promise<{ removedIntervals: RemovedInterval[]; outputFilename: string }> {
  const { clipId, absInputPath, segments, captions } = params;

  // Only consider captions within our segments
  const segCaptions = captions.filter((c) =>
    segments.some((s) => c.startMs >= s.startMs && c.endMs <= s.endMs)
  );

  const toRemove: RemovedInterval[] = [];

  // 1. Gaps between consecutive words — only within the same segment.
  // Without this check, the space between two segments (which can be many minutes)
  // would be treated as a silence to remove, making removedMs >> totalOriginalMs
  // and clamping the output to 1 second.
  for (let i = 0; i < segCaptions.length - 1; i++) {
    const curr = segCaptions[i];
    const next = segCaptions[i + 1];
    const inSameSegment = segments.some(
      (s) => curr.startMs >= s.startMs && curr.endMs <= s.endMs &&
             next.startMs >= s.startMs && next.endMs <= s.endMs,
    );
    if (!inSameSegment) continue;
    const gap = next.startMs - curr.endMs;
    if (gap > GAP_THRESHOLD_MS) {
      // Keep a 100ms breath room at the start/end of the gap
      toRemove.push({
        startMs: curr.endMs + 100,
        endMs: next.startMs - 100,
      });
    }
  }

  // 2. Filler words
  for (let i = 0; i < segCaptions.length; i++) {
    const word = segCaptions[i];
    const clean = word.text.toLowerCase().trim().replace(/[^a-z\s-]/g, "");

    if (FILLER_WORDS.has(clean)) {
      toRemove.push({ startMs: word.startMs, endMs: word.endMs });
    } else if (CONTEXTUAL_FILLERS.has(clean)) {
      if (isContextualFiller(word, segCaptions[i - 1], segCaptions[i + 1])) {
        toRemove.push({ startMs: word.startMs, endMs: word.endMs });
      }
    }
  }

  // 3. Trailing silence at end of each segment (prevents frozen last frame)
  for (const seg of segments) {
    const wordsInSeg = segCaptions.filter(
      (c) => c.startMs >= seg.startMs && c.endMs <= seg.endMs
    );
    const lastWord = wordsInSeg[wordsInSeg.length - 1];
    if (lastWord && seg.endMs - lastWord.endMs > GAP_THRESHOLD_MS) {
      toRemove.push({
        startMs: lastWord.endMs + 100,
        endMs: seg.endMs,
      });
    }
  }

  // 4. Also add gaps between segments themselves (sections not in any segment)
  // These are removed by definition — handled by only including segment ranges

  const removedIntervals = mergeIntervals(toRemove);

  // Build "keep" windows = segments minus removed intervals
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
    throw new Error("Gap edit produced no keep windows — check segment timestamps");
  }

  // Build ffmpeg filter_complex
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
