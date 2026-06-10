import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { transcribe, toCaptions } from "@remotion/install-whisper-cpp";
import { ensureWhisper, WHISPER_DIR, WHISPER_MODEL, WHISPER_VERSION } from "../lib/whisper";
import type { Caption } from "../lib/remapCaptions";
import type { ClipSegment } from "../schema";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const TMP_DIR = path.join(VIDEOS_DIR, "tmp");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");

/**
 * Gets video duration in milliseconds using ffprobe.
 */
export function getVideoDurationMs(absVideoPath: string): number {
  const out = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "${absVideoPath}"`,
    { stdio: "pipe" }
  ).toString().trim();
  const sec = parseFloat(out);
  if (isNaN(sec)) throw new Error(`Could not read duration from ${absVideoPath}`);
  return Math.round(sec * 1000);
}

/**
 * Transcribes the full video in 10-minute chunks.
 * Returns word-level captions across the entire video timeline.
 */
export async function transcribeFullVideo(
  jobId: string,
  absVideoPath: string,
): Promise<Caption[]> {
  await ensureWhisper();

  const CHUNK_MS = 10 * 60 * 1000; // 10-minute chunks
  const durationMs = getVideoDurationMs(absVideoPath);
  const chunks: { startMs: number; endMs: number }[] = [];

  for (let start = 0; start < durationMs; start += CHUNK_MS) {
    chunks.push({ startMs: start, endMs: Math.min(start + CHUNK_MS, durationMs) });
  }

  console.log(`[transcribe] Full video: ${Math.round(durationMs / 60000)}min → ${chunks.length} chunk(s)`);

  const allCaptions: Caption[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const durationSec = (chunk.endMs - chunk.startMs) / 1000;
    const wavPath = path.join(TMP_DIR, `${jobId}-chunk${i}.wav`);

    console.log(`[transcribe] Chunk ${i + 1}/${chunks.length}: ${Math.round(chunk.startMs / 60000)}min – ${Math.round(chunk.endMs / 60000)}min`);

    execSync(
      `ffmpeg -i "${absVideoPath}" -ss ${chunk.startMs / 1000} -t ${durationSec} -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}" -y`,
      { stdio: "pipe" }
    );

    const whisperOutput = await transcribe({
      model: WHISPER_MODEL,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      inputPath: wavPath,
      tokenLevelTimestamps: true,
    });

    const { captions } = toCaptions({ whisperCppOutput: whisperOutput });

    for (const c of captions) {
      allCaptions.push({
        text: c.text,
        startMs: c.startMs + chunk.startMs,
        endMs: c.endMs + chunk.startMs,
      });
    }

    if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
  }

  allCaptions.sort((a, b) => a.startMs - b.startMs);
  return allCaptions;
}

/**
 * Formats word-level captions into the [M:SS = Nms] transcript format Grok expects.
 * Groups words into ~60-second blocks with a timestamp marker at each block start.
 */
export function buildTranscriptFromCaptions(captions: Caption[]): string {
  const BLOCK_MS = 60_000;
  const lines: string[] = [];
  let blockStart = 0;
  let blockWords: string[] = [];

  const flush = () => {
    if (blockWords.length === 0) return;
    const m = Math.floor(blockStart / 60000);
    const s = Math.floor((blockStart % 60000) / 1000);
    lines.push(`[${m}:${String(s).padStart(2, "0")} = ${blockStart}ms]`);
    lines.push(blockWords.join(" "));
    lines.push("");
    blockWords = [];
  };

  for (const c of captions) {
    if (c.startMs >= blockStart + BLOCK_MS) {
      flush();
      blockStart = Math.floor(c.startMs / BLOCK_MS) * BLOCK_MS;
    }
    blockWords.push(c.text.trim());
  }
  flush();

  return lines.join("\n");
}

/**
 * Runs Whisper on each segment's time window (not the full video).
 * Returns combined word-level captions in original video timeline.
 */
export async function transcribeClipSegments(
  clipId: string,
  absVideoPath: string,
  segments: ClipSegment[],
): Promise<{ captions: Caption[]; captionsFilename: string }> {
  await ensureWhisper();

  const allCaptions: Caption[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const durationSec = (seg.endMs - seg.startMs) / 1000;
    const wavPath = path.join(TMP_DIR, `${clipId}-seg${i}.wav`);

    // Extract just this segment's audio window
    execSync(
      `ffmpeg -i "${absVideoPath}" -ss ${seg.startMs / 1000} -t ${durationSec} -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}" -y`,
      { stdio: "pipe" }
    );

    const whisperOutput = await transcribe({
      model: WHISPER_MODEL,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      inputPath: wavPath,
      tokenLevelTimestamps: true,
    });

    const { captions } = toCaptions({ whisperCppOutput: whisperOutput });

    // Offset captions back to original video timeline
    for (const c of captions) {
      allCaptions.push({
        text: c.text,
        startMs: c.startMs + seg.startMs,
        endMs: c.endMs + seg.startMs,
      });
    }

    if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
  }

  // Sort by start time and write
  allCaptions.sort((a, b) => a.startMs - b.startMs);
  const captionsFilename = `captions-${clipId}.json`;
  fs.writeFileSync(path.join(PUBLIC_DIR, captionsFilename), JSON.stringify(allCaptions, null, 2));

  return { captions: allCaptions, captionsFilename };
}
