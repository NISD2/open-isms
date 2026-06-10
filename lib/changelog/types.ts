import { z } from "zod";

export const CATEGORY_KEYS = ["product", "content", "course", "compliance", "regulatory"] as const;
export type Category = typeof CATEGORY_KEYS[number];

export function isCategory(v: string): v is Category {
  return (CATEGORY_KEYS as readonly string[]).includes(v);
}

const ChangelogLinkSchema = z.object({
  labelDe: z.string().min(1),
  labelEn: z.string().min(1),
  href: z.string().min(1),
});

const ChangelogEntrySchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  category: z.enum(CATEGORY_KEYS),
  titleDe: z.string().min(1),
  titleEn: z.string().min(1),
  bodyDe: z.string().min(1),
  bodyEn: z.string().min(1),
  links: z.array(ChangelogLinkSchema).optional(),
  version: z.string().optional(),
});

export const ChangelogSchema = z.object({
  entries: z.array(ChangelogEntrySchema),
});

export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;
export type ChangelogLink = z.infer<typeof ChangelogLinkSchema>;
export type Changelog = z.infer<typeof ChangelogSchema>;
