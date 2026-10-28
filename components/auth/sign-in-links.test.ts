import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

/**
 * A signup keeps the campaign tags and the page it started from only if the link that led to
 * sign-in hands them on (SignInLink). A plain <Link href="/auth/signin"> on a public page drops
 * both, and that is how signups ended up with no source at all. This reads the code with the
 * TypeScript compiler, so a new plain link fails here instead of in next month's numbers.
 */

const ROOT = join(import.meta.dir, "..", "..");
const SIGN_IN = "/auth/signin";

/** Files that may link to sign-in without SignInLink, each with the reason. */
const ALLOWED: Readonly<Record<string, string>> = {
  "components/auth/SignInLink.tsx": "is the tracked link",
  "app/[locale]/auth/forgot-password/page.tsx":
    "back to sign-in, inside the sign-in flow",
  "app/[locale]/auth/setup/page.tsx": "back to sign-in, inside the sign-in flow",
  "components/invite/AcceptInviteCard.tsx":
    "an invite's path is a credential, which a signup must never record",
};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return name.endsWith(".tsx") && !name.includes(".test.") ? [full] : [];
  });

const mentionsSignIn = (node: ts.Node): boolean =>
  (ts.isStringLiteralLike(node) && node.text.includes(SIGN_IN)) ||
  (ts.isTemplateHead(node) && node.text.includes(SIGN_IN)) ||
  ts.forEachChild(node, mentionsSignIn) === true;

/** `file:line` of every place a page links to sign-in itself instead of through SignInLink. */
function plainSignInLinks(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const where = (node: ts.Node) =>
    `${relative(ROOT, file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    const isHref =
      ts.isJsxAttribute(node) &&
      node.name.getText() === "href" &&
      node.initializer !== undefined &&
      mentionsSignIn(node.initializer);
    // A route object kept in a constant and passed as href later.
    const isRouteObject =
      ts.isPropertyAssignment(node) &&
      node.name.getText() === "pathname" &&
      mentionsSignIn(node.initializer) &&
      ts.findAncestor(node, ts.isJsxAttribute) === undefined;
    if (isHref || isRouteObject) found.push(where(node));
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("links to sign-in", () => {
  const files = [join(ROOT, "app"), join(ROOT, "components")].flatMap(sourceFiles);

  test("every allowed exception still exists and still needs its exception", () => {
    for (const path of Object.keys(ALLOWED)) {
      const file = join(ROOT, path);
      expect(statSync(file).isFile()).toBe(true);
      expect(plainSignInLinks(file).length).toBeGreaterThan(0);
    }
  });

  test("a page reaches sign-in through SignInLink, so a signup keeps its source", () => {
    const offenders = files
      .filter((file) => !(relative(ROOT, file) in ALLOWED))
      .flatMap(plainSignInLinks);
    expect(offenders).toEqual([]);
  });
});
