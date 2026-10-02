import "@/lib/server-guard";

import type { Element, ElementContent, Root, RootContent, Text } from "hast";
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

/**
 * Render a document someone approves, such as a policy the walk wrote. Its text carries answers
 * company members typed, so on top of the newsletter rules it loads nothing from outside and
 * hides no address: an image becomes its alt text, and a link whose text is not its address
 * shows the address after it.
 */
export async function renderDocumentMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSafeUrls)
    .use(rehypePlainAddresses)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

const text = (value: string): Text => ({ type: "text", value });

const textOf = (node: ElementContent): string =>
  node.type === "text"
    ? node.value
    : node.type === "element"
      ? node.children.map(textOf).join("")
      : "";

/** The address a reader recognises: an email link's address without its scheme. */
const addressOf = (href: string): string => {
  try {
    const url = new URL(href);
    return url.protocol === "mailto:" ? url.pathname : href;
  } catch {
    return href;
  }
};

const plainAddresses = (nodes: readonly ElementContent[]): ElementContent[] =>
  nodes.flatMap((node): ElementContent[] => {
    if (node.type !== "element") return [node];
    if (node.tagName === "img") {
      const alt = node.properties.alt;
      return typeof alt === "string" && alt ? [text(alt)] : [];
    }
    const children = plainAddresses(node.children);
    const href = node.properties.href;
    const address =
      node.tagName === "a" && typeof href === "string" ? addressOf(href) : null;
    return [
      {
        ...node,
        children:
          address !== null && address !== children.map(textOf).join("")
            ? [...children, text(` (${address})`)]
            : children,
      },
    ];
  });

function rehypePlainAddresses() {
  return (tree: Root) => {
    tree.children = tree.children.flatMap((node): RootContent[] =>
      node.type === "doctype" ? [node] : plainAddresses([node]),
    );
  };
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
