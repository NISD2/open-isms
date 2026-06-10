import { Hono } from "hono";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { jobs, clips, sections } from "../schema";
import { eq, desc, asc } from "drizzle-orm";
import { jobEvents, type PipelineEvent, enqueueTranscription } from "../jobs/queue";
import { runAnalysis } from "../jobs/analyze";
import { renderApprovedClips, renderLongform } from "../jobs/render";

const VIDEOS_DIR = path.join(import.meta.dir, "..", "..");

function deleteIfExists(filePath: string) {
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }
}

const app = new Hono();

async function getJobWithClips(jobId: string) {
  const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).then((r) => r[0]);
  if (!job) return null;
  const jobClips = await db.select().from(clips).where(eq(clips.jobId, jobId)).orderBy(asc(clips.sortOrder));
  const jobSections = job.mode === "longform"
    ? await db.select().from(sections).where(eq(sections.jobId, jobId)).orderBy(asc(sections.sortOrder))
    : [];
  return { ...job, clips: jobClips, sections: jobSections };
}

// List all jobs (without clips for brevity)
app.get("/", async (c) => {
  const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  return c.json(allJobs);
});

// Get single job with clips
app.get("/:id", async (c) => {
  const job = await getJobWithClips(c.req.param("id"));
  if (!job) return c.json({ error: "Not found" }, 404);
  return c.json(job);
});

// SSE stream for live job progress
app.get("/:id/events", (c) => {
  const jobId = c.req.param("id");

  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        let closed = false;
        let ping: ReturnType<typeof setInterval> | null = null;

        const cleanup = () => {
          if (closed) return;
          closed = true;
          if (ping) clearInterval(ping);
          jobEvents.off(jobId, send);
          try { controller.close(); } catch { /* already closed */ }
        };

        const send = (event: PipelineEvent) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch { return; }
          if (event.type === "done" || event.type === "error") cleanup();
        };

        jobEvents.on(jobId, send);

        // Keep-alive ping every 15s
        ping = setInterval(() => {
          if (closed) { if (ping) clearInterval(ping); return; }
          try { controller.enqueue(encoder.encode(": ping\n\n")); } catch { cleanup(); }
        }, 15000);

        c.req.raw.signal.addEventListener("abort", cleanup);
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
});

// Re-run Grok analysis (optionally update customContext first)
app.post("/:id/analyze", async (c) => {
  const jobId = c.req.param("id");
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) return c.json({ error: "Not found" }, 404);

  let body: { context?: string } = {};
  try { body = await c.req.json(); } catch { /* no body is fine */ }

  if (body.context !== undefined) {
    const customContext = body.context.trim() || null;
    await db.update(jobs).set({ customContext, updatedAt: new Date() }).where(eq(jobs.id, jobId));
  }

  runAnalysis(jobId).catch(() => {});
  return c.json({ started: true });
});

// Delete job + all associated files from disk
app.delete("/:id", async (c) => {
  const jobId = c.req.param("id");
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) return c.json({ error: "Not found" }, 404);

  const jobClips = await db.select().from(clips).where(eq(clips.jobId, jobId));

  // Refuse to delete while any clip is actively rendering
  const renderingClips = jobClips.filter(c => c.status === "rendering");
  if (renderingClips.length > 0) {
    return c.json({ error: "A clip is currently rendering. Wait for it to finish before deleting." }, 409);
  }

  // Delete per-clip files
  for (const clip of jobClips) {
    if (clip.gapEditedPath) deleteIfExists(path.join(VIDEOS_DIR, clip.gapEditedPath));
    if (clip.clipCaptionsPath) deleteIfExists(path.join(VIDEOS_DIR, clip.clipCaptionsPath));
    if (clip.outputPath) deleteIfExists(path.join(VIDEOS_DIR, clip.outputPath));
  }

  // Delete job-level files: uploaded video + transcript + public copy
  deleteIfExists(path.join(VIDEOS_DIR, job.uploadPath));
  if (job.geminiTranscriptPath) deleteIfExists(path.join(VIDEOS_DIR, job.geminiTranscriptPath));
  // Public copy has same filename as upload (just different dir)
  const publicCopy = job.uploadPath.replace(/^uploads\//, "public/");
  deleteIfExists(path.join(VIDEOS_DIR, publicCopy));
  // Longform: edited master + edited captions
  if (job.editedVideoPath) deleteIfExists(path.join(VIDEOS_DIR, job.editedVideoPath));
  if (job.editedCaptionsPath) deleteIfExists(path.join(VIDEOS_DIR, job.editedCaptionsPath));

  // Delete DB record (clips cascade)
  await db.delete(jobs).where(eq(jobs.id, jobId));

  console.log(`[delete] Job ${jobId} and associated files removed`);
  return c.json({ ok: true });
});

// Render stage1_approved clips (daily) or the longform 16:9 video
app.post("/:id/render", async (c) => {
  const jobId = c.req.param("id");
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) return c.json({ error: "Not found" }, 404);
  if (job.mode === "longform") {
    enqueueTranscription(() => renderLongform(jobId).then(() => {}));
  } else {
    enqueueTranscription(() => renderApprovedClips(jobId).then(() => {}));
  }
  return c.json({ started: true });
});

// Render approved shorts for a longform job
app.post("/:id/render-shorts", async (c) => {
  const jobId = c.req.param("id");
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) return c.json({ error: "Not found" }, 404);
  enqueueTranscription(() => renderApprovedClips(jobId).then(() => {}));
  return c.json({ started: true });
});

// Per-clip render status (polling fallback)
app.get("/:id/render/status", async (c) => {
  const jobClips = await db
    .select()
    .from(clips)
    .where(eq(clips.jobId, c.req.param("id")))
    .orderBy(asc(clips.sortOrder));
  return c.json(jobClips.map((clip) => ({ id: clip.id, status: clip.status, outputPath: clip.outputPath })));
});

export default app;
