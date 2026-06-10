import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { sections } from "../schema";
import { eq } from "drizzle-orm";

const app = new Hono();

const PatchSectionSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  startMs: z.number().int().optional(),
  endMs: z.number().int().optional(),
  included: z.boolean().optional(),
});

app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = PatchSectionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const updateData: Partial<typeof sections.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.subtitle !== undefined) updateData.subtitle = parsed.data.subtitle;
  if (parsed.data.startMs !== undefined) updateData.startMs = parsed.data.startMs;
  if (parsed.data.endMs !== undefined) updateData.endMs = parsed.data.endMs;
  if (parsed.data.included !== undefined) updateData.included = parsed.data.included;

  const [updated] = await db
    .update(sections)
    .set(updateData)
    .where(eq(sections.id, id))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

export default app;
