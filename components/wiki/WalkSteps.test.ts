import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { WALK } from "@/lib/durchgang";

/**
 * Wiki articles render on request, so a step code the walk does not have would only surface as a
 * 500 on that page in production (stepsOf throws). This reads every wiki page and WalkSteps itself
 * with the TypeScript parser and checks each code against the walk instead.
 */
const ROOT = process.cwd();
const WIKI = path.join(ROOT, "app", "[locale]", "wiki");

const pageFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return pageFiles(full);
    return entry.name === "page.tsx" ? [full] : [];
  });

const stringsOf = (node: ts.Node | undefined): string[] => {
  if (!node) return [];
  const inner = ts.isAsExpression(node) ? node.expression : node;
  return ts.isArrayLiteralExpression(inner)
    ? inner.elements.filter(ts.isStringLiteral).map((e) => e.text)
    : [];
};

/** The codes a file hands to WalkSteps, and NATIONAL_STEPS where it is declared. */
const codesIn = (file: string): string[] => {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText(source) === "WalkSteps"
    ) {
      for (const attribute of node.attributes.properties) {
        if (
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText(source) === "codes" &&
          attribute.initializer &&
          ts.isJsxExpression(attribute.initializer)
        ) {
          found.push(...stringsOf(attribute.initializer.expression));
        }
      }
    }
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === "NATIONAL_STEPS"
    ) {
      found.push(...stringsOf(node.initializer));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

describe("WalkSteps codes", () => {
  const walkCodes = new Set(WALK.map((item) => item.code));
  const files = [
    ...pageFiles(WIKI),
    path.join(ROOT, "components", "wiki", "WalkSteps.tsx"),
  ];
  const uses = files.flatMap((file) =>
    codesIn(file).map((code) => ({ file: path.relative(ROOT, file), code })),
  );

  test("the wiki uses the block at all, so the scan finds something", () => {
    expect(uses.length).toBeGreaterThan(0);
  });

  test("every code is a step of the walk", () => {
    expect(uses.filter(({ code }) => !walkCodes.has(code))).toEqual([]);
  });
});
