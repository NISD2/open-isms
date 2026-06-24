import "@/lib/server-guard";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

/**
 * Render newsletter body markdown to email-safe HTML.
 *
 * The body is authored inline by a platform admin in the composer, so the
 * source is trusted, but we deliberately do NOT enable raw-HTML passthrough
 * (no rehype-raw) — the newsletter is plain markdown by design. GFM is on for
 * tables, strikethrough and autolinks. The resulting tags inherit the base
 * font color/size from the wrapping container in newsletterEmail().
 */
export async function renderNewsletterMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}
