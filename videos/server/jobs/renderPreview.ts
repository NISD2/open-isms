import path from "path";
import fs from "fs";
import { emitJobEvent } from "./queue";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const OUT_DIR = path.join(VIDEOS_DIR, "out");

/**
 * Renders a low-resolution (0.5 scale) preview of the gap-edited clip.
 * Output: out/previews/{clipId}-preview.mp4
 * Captions are baked in via CaptionOverlay (PipelineMultiClip composition).
 */
export async function renderPreview(params: {
  clipId: string;
  jobId: string;
  gapEditedFilename: string;
  captionsFilename: string;
  totalDurationMs: number;
}): Promise<string> {
  const { clipId, jobId, gapEditedFilename, captionsFilename, totalDurationMs } = params;

  const previewDir = path.join(OUT_DIR, "previews");
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  const outputPath = path.join(previewDir, `${clipId}-preview.mp4`);

  const props = JSON.stringify({
    videoSrc: gapEditedFilename,
    captionsFile: captionsFilename,
    segments: [{ startMs: 0, endMs: totalDurationMs }],
  });

  const label = `[preview:${clipId.slice(0, 8)}]`;
  console.log(`${label} Starting preview render → ${outputPath}`);
  console.log(`${label} Duration: ${Math.round(totalDurationMs / 1000)}s | captions: ${captionsFilename}`);
  emitJobEvent(jobId, { type: "progress", message: `Rendering preview for clip ${clipId.slice(0, 8)}...` });

  const proc = Bun.spawn(
    [
      "bunx", "remotion", "render", "PipelineMultiClip",
      outputPath,
      "--props", props,
      "--scale", "0.5",
      "--concurrency", "4",
    ],
    {
      cwd: VIDEOS_DIR,
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  const decoder = new TextDecoder();
  const reader = proc.stdout.getReader();
  (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        console.log(`${label} ${trimmed}`);
        emitJobEvent(jobId, { type: "progress", message: trimmed });
      }
    }
  })();

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    const tail = stderr.slice(-500);
    console.error(`${label} Preview render FAILED (exit ${exitCode}):\n${tail}`);
    throw new Error(`Preview render failed: ${tail}`);
  }

  console.log(`${label} Preview render complete ✓`);
  return `out/previews/${clipId}-preview.mp4`;
}
