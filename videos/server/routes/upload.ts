import { Hono } from "hono";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { jobs } from "../schema";
import { enqueueTranscription } from "../jobs/queue";
import { runAnalysis } from "../jobs/analyze";
import { parseGeminiTranscript, buildGrokTranscript } from "../lib/parseGeminiTranscript";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");
const UPLOADS_DIR = path.join(VIDEOS_DIR, "uploads");
const PUBLIC_DIR = path.join(VIDEOS_DIR, "public");

const app = new Hono();

app.post("/", async (c) => {
  console.log("[upload] POST /api/upload received");

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch (err) {
    console.error("[upload] Failed to parse formData:", err);
    return c.json({ error: "Failed to parse form data" }, 400);
  }

  const videoFile = formData.get("video");
  const transcriptFile = formData.get("transcript");

  console.log("[upload] video field:", videoFile ? `File(${(videoFile as File).name}, ${(videoFile as File).size} bytes)` : "missing");
  console.log("[upload] transcript field:", transcriptFile ? `File(${(transcriptFile as File).name}, ${(transcriptFile as File).size} bytes)` : "missing");

  if (!videoFile || typeof videoFile === "string") {
    console.error("[upload] Rejected: no video file");
    return c.json({ error: "No video file provided" }, 400);
  }

  // Transcript is optional — if not provided, Grok analysis is skipped (job stays at analyzing)
  const hasTranscript = transcriptFile && typeof transcriptFile !== "string";

  const uuid = crypto.randomUUID();
  const videoExt = (videoFile as File).name.split(".").pop() ?? "mp4";
  const videoFilename = `${uuid}.${videoExt}`;
  const transcriptFilename = `${uuid}-transcript.txt`;

  const absVideoUpload = path.join(UPLOADS_DIR, videoFilename);
  const absVideoPublic = path.join(PUBLIC_DIR, videoFilename);
  const absTranscriptPath = path.join(UPLOADS_DIR, transcriptFilename);

  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  console.log("[upload] Saving video to:", absVideoUpload);
  try {
    await Bun.write(absVideoUpload, videoFile as File);
    console.log("[upload] Video saved to uploads/");
    await Bun.write(absVideoPublic, Bun.file(absVideoUpload));
    console.log("[upload] Video copied to public/");
  } catch (err) {
    console.error("[upload] Failed to write video:", err);
    return c.json({ error: "Failed to save video file" }, 500);
  }

  let grokTranscript: string | null = null;
  if (hasTranscript) {
    try {
      const transcriptText = await (transcriptFile as File).text();
      fs.writeFileSync(absTranscriptPath, transcriptText);
      console.log("[upload] Transcript saved, length:", transcriptText.length, "chars");
      const sections = parseGeminiTranscript(transcriptText);
      console.log("[upload] Parsed", sections.length, "transcript sections");
      grokTranscript = buildGrokTranscript(sections);
      console.log("[upload] Grok transcript built, length:", grokTranscript.length, "chars");
    } catch (err) {
      console.error("[upload] Failed to process transcript:", err);
      // Non-fatal — continue without transcript
      grokTranscript = null;
    }
  } else {
    console.log("[upload] No transcript provided — will skip Grok analysis");
  }

  const now = new Date();
  try {
    await db.insert(jobs).values({
      id: uuid,
      originalFilename: (videoFile as File).name,
      uploadPath: `uploads/${videoFilename}`,
      mode: hasTranscript ? "daily" : "longform",
      geminiTranscriptPath: hasTranscript ? `uploads/${transcriptFilename}` : null,
      transcriptText: grokTranscript,
      status: "uploading",
      outputDateDir: now.toISOString().slice(0, 10),
      createdAt: now,
      updatedAt: now,
    });
    console.log("[upload] Job inserted into DB:", uuid);
  } catch (err) {
    console.error("[upload] DB insert failed:", err);
    return c.json({ error: "Failed to create job record" }, 500);
  }

  console.log("[upload] Enqueueing analysis for job:", uuid);
  enqueueTranscription(async () => {
    await runAnalysis(uuid);
  });

  console.log("[upload] Returning jobId:", uuid);
  return c.json({ jobId: uuid });
});

export default app;
