import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { clips } from "../schema";
import type { ClipSegment } from "../schema";
import { eq } from "drizzle-orm";

const app = new Hono();

const SegmentSchema = z.object({ startMs: z.number().int(), endMs: z.number().int() });

const PatchClipSchema = z.object({
  title: z.string().optional(),
  segments: z.array(SegmentSchema).optional(),
  status: z.enum(["suggested", "stage1_approved", "rejected"]).optional(),
});

const CreateClipSchema = z.object({
  jobId: z.string(),
  title: z.string(),
  segments: z.array(SegmentSchema),
});

// Update clip (title, segments, approve/reject)
app.patch("/:id", async (c) => {
  const clipId = c.req.param("id");
  const body = await c.req.json();
  const parsed = PatchClipSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const updateData: Partial<typeof clips.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.segments !== undefined) updateData.segments = parsed.data.segments as ClipSegment[];

  const [updated] = await db
    .update(clips)
    .set(updateData)
    .where(eq(clips.id, clipId))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// Reset a rendered clip back to suggested so segments can be edited and re-rendered
app.post("/:id/reset", async (c) => {
  const [updated] = await db
    .update(clips)
    .set({
      status: "suggested",
      gapEditedPath: null,
      clipCaptionsPath: null,
      outputPath: null,
      slug: null,
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(clips.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// Soft-delete (reject)
app.delete("/:id", async (c) => {
  const [updated] = await db
    .update(clips)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(clips.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

// Create manual clip
app.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = CreateClipSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const now = new Date();
  const id = crypto.randomUUID();

  const [clip] = await db
    .insert(clips)
    .values({
      id,
      jobId: parsed.data.jobId,
      title: parsed.data.title,
      segments: parsed.data.segments as ClipSegment[],
      status: "suggested",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json(clip, 201);
});

export default app;
