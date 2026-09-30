import "@/lib/server-guard";

import type { Element, Root } from "hast";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

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
    .use(rehypeSafeUrls)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

const SAFE_PROTOCOLS: ReadonlySet<string> = new Set([
  "http:",
  "https:",
  "mailto:",
  "tel:",
]);
const URL_PROPERTIES = ["href", "src"] as const;
const BASE = "http://local.invalid";

/**
 * Markdown keeps whatever scheme a link names, so `[x](javascript:...)` rendered as a live
 * script link on the public archive page. The URL parser decides the scheme, the same parser
 * the browser uses on the attribute, so case, entities, tabs and leading control characters
 * cannot spell one past it. A relative link resolves against the base and stays.
 */
function isSafeUrl(value: string): boolean {
  try {
    return SAFE_PROTOCOLS.has(new URL(value, BASE).protocol);
  } catch {
    return false;
  }
}

function rehypeSafeUrls() {
  return (tree: Root) => dropUnsafeUrls(tree);
}

function dropUnsafeUrls(node: Root | Element): void {
  for (const child of node.children) {
    if (child.type !== "element") continue;
    for (const key of URL_PROPERTIES) {
      const value = child.properties[key];
      if (value !== undefined && !(typeof value === "string" && isSafeUrl(value))) {
        child.properties[key] = undefined;
      }
    }
    dropUnsafeUrls(child);
  }
}
