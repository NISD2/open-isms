import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Nodes } from "mdast";
import { DOCS_ENTRIES, DOCS_SECTIONS, findEntry } from "./toc";

/**
 * The table of contents and the content directory have to agree, and the
 * cross-links between pages have to resolve. Both drift silently otherwise:
 * a TOC entry without a file is a 500 at build time, an orphan file is a page
 * nobody can reach, and a mistyped link is a 404 a reader finds before we do.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content", "docs");

async function contentPaths(): Promise<string[]> {
  const sections = await readdir(CONTENT_ROOT, { withFileTypes: true });
  const perSection = await Promise.all(
    sections
      .filter((entry) => entry.isDirectory())
      .map(async (section) => {
        const files = await readdir(path.join(CONTENT_ROOT, section.name));
        return files
          .filter((file) => file.endsWith(".md"))
          .map((file) => `${section.name}/${path.basename(file, ".md")}`);
      }),
  );
  return perSection.flat().sort();
}

describe("docs table of contents", () => {
  test("every entry has a content file", async () => {
    const onDisk = new Set(await contentPaths());
    const missing = DOCS_ENTRIES.filter((entry) => !onDisk.has(entry.path));
    expect(missing.map((entry) => entry.path)).toEqual([]);
  });

  test("every content file is reachable from the table of contents", async () => {
    const orphans = (await contentPaths()).filter((candidate) => !findEntry(candidate));
    expect(orphans).toEqual([]);
  });

  test("slugs are unique", () => {
    const paths = DOCS_ENTRIES.map((entry) => entry.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("every page has a title and a one-line description", () => {
    for (const { page } of DOCS_ENTRIES) {
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.description.length).toBeGreaterThan(0);
      expect(page.description).not.toContain("\n");
    }
  });

  test("sections are not empty", () => {
    for (const section of DOCS_SECTIONS) {
      expect(section.pages.length).toBeGreaterThan(0);
    }
  });
});

/** Link targets from the parsed document, rather than pattern-matched out of the text. */
function linkTargets(tree: Nodes): string[] {
  const targets: string[] = [];
  const walk = (node: Nodes): void => {
    if (node.type === "link") targets.push(node.url);
    if ("children" in node && node.children) {
      for (const child of node.children) walk(child as Nodes);
    }
  };
  walk(tree);
  return targets;
}

describe("docs cross-links", () => {
  const parser = unified().use(remarkParse).use(remarkGfm);

  test("every /docs link in the content resolves to a page", async () => {
    const broken: string[] = [];

    for (const contentPath of await contentPaths()) {
      const source = await readFile(path.join(CONTENT_ROOT, `${contentPath}.md`), "utf8");
      for (const url of linkTargets(parser.parse(source))) {
        if (!url.startsWith("/docs/")) continue;
        const target = url.slice("/docs/".length).split("#")[0];
        if (!findEntry(target)) broken.push(`${contentPath} -> ${url}`);
      }
    }

    expect(broken).toEqual([]);
  });
});
