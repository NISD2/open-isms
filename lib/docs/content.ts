import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import type { Nodes, Element, Root } from "hast";

/**
 * Markdown → HTML for /docs.
 *
 * Page titles and descriptions live in lib/docs/toc.ts, not in frontmatter,
 * so the sidebar and the page heading cannot disagree and no YAML parser is
 * needed at runtime. A content file is the body and nothing else.
 *
 * Code blocks are highlighted at build time by Shiki, which is a real
 * tokenizer rather than a pile of regular expressions, and produces plain
 * spans with inline colours — no client-side highlighting bundle and nothing
 * for the CSP to allow.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content", "docs");

/**
 * Languages used across the content files. Loading only these keeps the build
 * light. `text` is not listed: it is one of Shiki's special languages, always
 * available, and naming it here would not typecheck against BuiltinLanguage.
 */
const LANGUAGES = [
  "bash",
  "yaml",
  "json",
  "typescript",
  "tsx",
  "sql",
  "ini",
  "docker",
] as const;

export interface Heading {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
}

export interface RenderedDoc {
  readonly html: string;
  readonly headings: readonly Heading[];
}

/**
 * Wraps every table in a scroll container. A requirements table on a phone
 * would otherwise widen the whole page instead of scrolling inside itself.
 */
function rehypeWrapTables() {
  return (tree: Root): void => {
    const walk = (node: Nodes): void => {
      if (!("children" in node) || !node.children) return;
      node.children = node.children.map((child) => {
        walk(child as Nodes);
        if (child.type === "element" && child.tagName === "table") {
          return {
            type: "element",
            tagName: "div",
            properties: { className: ["docs-table-wrapper"] },
            children: [child],
          } satisfies Element;
        }
        return child;
      });
    };
    walk(tree);
  };
}

/**
 * Gives every heading a link to itself, the way every docs site the reader has
 * used does. Runs after rehype-slug, so the id it links to already exists.
 * Someone answering a question needs to link to one section, not a page.
 */
function rehypeHeadingAnchors() {
  return (tree: Root): void => {
    const walk = (node: Nodes): void => {
      if (!("children" in node) || !node.children) return;
      for (const child of node.children) {
        walk(child as Nodes);
        if (child.type !== "element") continue;
        if (child.tagName !== "h2" && child.tagName !== "h3") continue;
        const id = child.properties?.id;
        if (typeof id !== "string") continue;

        child.children.push({
          type: "element",
          tagName: "a",
          properties: {
            href: `#${id}`,
            className: ["docs-heading-anchor"],
            ariaLabel: "Link to this section",
          },
          children: [{ type: "text", value: "#" }],
        } satisfies Element);
      }
    };
    walk(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeHeadingAnchors)
  .use(rehypeWrapTables)
  .use(rehypeShiki, {
    theme: "github-dark-default",
    langs: [...LANGUAGES],
    // A fenced block with no language still gets the themed background
    // rather than falling back to an unstyled <pre>.
    fallbackLanguage: "text",
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

function isElement(node: Nodes): node is Element {
  return node.type === "element";
}

function isHeadingAnchor(node: Nodes): boolean {
  if (node.type !== "element") return false;
  const className = node.properties?.className;
  return Array.isArray(className) && className.includes("docs-heading-anchor");
}

/**
 * Plain text of a heading, walking the tree rather than stripping tags from
 * HTML. The self-link this pipeline appends to every heading is skipped, or
 * every entry in "On this page" would end in a stray "#".
 */
function textOf(node: Nodes): string {
  if (node.type === "text") return node.value;
  if (isHeadingAnchor(node)) return "";
  if ("children" in node && node.children) {
    return node.children.map((child) => textOf(child as Nodes)).join("");
  }
  return "";
}

function collectHeadings(tree: Nodes): Heading[] {
  const headings: Heading[] = [];

  const walk = (node: Nodes): void => {
    if (isElement(node)) {
      const level = node.tagName === "h2" ? 2 : node.tagName === "h3" ? 3 : undefined;
      const id = typeof node.properties?.id === "string" ? node.properties.id : undefined;
      if (level && id) {
        headings.push({ id, text: textOf(node), level });
      }
    }
    if ("children" in node && node.children) {
      for (const child of node.children) walk(child as Nodes);
    }
  };

  walk(tree);
  return headings;
}

/**
 * Renders one content file. Throws if the file is missing, which surfaces a
 * TOC entry without content as a build failure rather than an empty page.
 */
export async function renderDoc(contentPath: string): Promise<RenderedDoc> {
  const source = await readFile(path.join(CONTENT_ROOT, `${contentPath}.md`), "utf8");

  const parsed = processor.parse(source);
  const transformed = await processor.run(parsed);

  return {
    html: processor.stringify(transformed),
    headings: collectHeadings(transformed),
  };
}
