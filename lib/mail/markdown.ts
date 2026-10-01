import "@/lib/server-guard";

import type { Element, Root } from "hast";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { BRAND } from "./layout";

/**
 * Render newsletter body markdown to email-safe HTML.
 *
 * The body is authored inline by a platform admin in the composer, so the
 * source is trusted, but we deliberately do NOT enable raw-HTML passthrough
 * (no rehype-raw) — the newsletter is plain markdown by design. GFM is on for
 * tables, strikethrough and autolinks. The resulting tags inherit the base
 * font color/size from the wrapping container in newsletterEmail().
 */
export function renderNewsletterMarkdown(markdown: string): Promise<string> {
  return render(markdown, null);
}

/** Every element of a formal record, styled inline: email clients drop <style> blocks. */
const RECORD_STYLES: Readonly<Record<string, string>> = {
  h1: `font-size: 16px; margin: 0 0 10px; color: ${BRAND.foreground};`,
  h2: `font-size: 14px; margin: 20px 0 8px; color: ${BRAND.foreground};`,
  h3: `font-size: 13px; margin: 14px 0 6px; color: ${BRAND.foreground};`,
  p: `font-size: 13px; line-height: 1.55; margin: 0 0 10px; color: ${BRAND.foreground};`,
  ul: `font-size: 13px; line-height: 1.55; margin: 0 0 10px; padding-left: 20px; color: ${BRAND.foreground};`,
  table: "border-collapse: collapse; width: 100%; margin: 4px 0 14px; font-size: 12px;",
  th: `border: 1px solid ${BRAND.border}; background: ${BRAND.muted}; padding: 5px 8px; text-align: left; vertical-align: top;`,
  td: `border: 1px solid ${BRAND.border}; padding: 5px 8px; text-align: left; vertical-align: top;`,
  code: "font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; word-break: break-all;",
};

/**
 * Render a formal record written in markdown (the erasure certificate) for the body of an email,
 * with its tables, headings and lists styled the way the email around them is.
 */
export function renderRecordMarkdown(markdown: string): Promise<string> {
  return render(markdown, RECORD_STYLES);
}

async function render(
  markdown: string,
  styles: Readonly<Record<string, string>> | null,
): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSafeUrls)
    .use(() => (tree: Root) => (styles ? styleElements(tree, styles) : undefined))
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

function styleElements(
  node: Root | Element,
  styles: Readonly<Record<string, string>>,
): void {
  for (const child of node.children) {
    if (child.type !== "element") continue;
    const style = styles[child.tagName];
    if (style) child.properties.style = style;
    styleElements(child, styles);
  }
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
