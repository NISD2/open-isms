import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { CANONICAL_PUBLIC_EXACT, CANONICAL_PUBLIC_PREFIXES } from "@/lib/public-paths";

/**
 * A signup keeps the campaign tags and the page it started from only if the link that led to
 * sign-in, or to a gated page the proxy sends on to sign-in, hands them on (SignInLink, GatedLink).
 * A plain Link drops both, and that is how signups ended up with no source. This reads the code
 * with the TypeScript compiler, so a new plain link fails here and not in next month's numbers.
 *
 * Found: a JSX href that is or contains the sign-in path (string, template head, middle or tail),
 * one that names a constant holding it (in any .ts or .tsx file, matched by name), a route object
 * with that pathname, and client navigation (push, replace, assign) to it. For gated pages: every
 * JSX href to one, in any file a public page imports, found by following the imports.
 *
 * Not found, say so rather than pretend: a href built by a function call or assembled at run time
 * (`href={signInHref()}`, `["/auth", "signin"].join("/")`); a constant matched by name when two
 * files give different things the same name; a link inside rich text from the message files; a
 * server `redirect()`, which is a gate, not a link, and which the proxy already answers with the
 * page the visitor was after.
 */

const ROOT = join(import.meta.dir, "..", "..");
const SIGN_IN = "/auth/signin";

/** Files that may link to sign-in without SignInLink, each with the reason. */
const SIGN_IN_ALLOWED: Readonly<Record<string, string>> = {
  "components/auth/SignInLink.tsx": "is the tracked link",
  "app/[locale]/auth/forgot-password/page.tsx":
    "back to sign-in, inside the sign-in flow",
  "app/[locale]/auth/setup/page.tsx": "back to sign-in, inside the sign-in flow",
  "components/invite/AcceptInviteCard.tsx":
    "an invite's path is a credential, which a signup must never record",
  "components/partner-contract/AccessPanel.tsx":
    "a partner who accepted an agreement on a token page; the token path must never be recorded",
};

/** Files that may link to a gated page from a public page without GatedLink, each with the reason. */
const GATED_ALLOWED: Readonly<Record<string, string>> = {
  "components/pricing/PaidPricingCards.tsx":
    "the signed-in branch of the order button; a signed-out visitor gets SignInLink",
  "components/portal/AppSidebar.tsx":
    "signed-in chrome, reached by the screenshot rigs (journey-preview); nobody signs up from it",
  "components/portal/DeleteAccountDialog.tsx": "signed-in chrome (the account menu)",
  "components/supplier-portal/SupplierAppSidebar.tsx":
    "signed-in chrome, reached by the screenshot rig (supplier-preview)",
  "components/gap-assessment/GapAssessmentResults.tsx":
    "the owner's buttons; the shared view, a token page, hides them",
};

/** Targets the proxy answers before it checks for a session, so they are not gated. */
const NOT_GATED = ["/api", "/docs", "/.well-known", "/_next"];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    if (name === "node_modules" || name === ".next") return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(name) && !name.includes(".test.") ? [full] : [];
  });

const parsed = new Map<string, ts.SourceFile>();
const parse = (file: string): ts.SourceFile => {
  const cached = parsed.get(file);
  if (cached) return cached;
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  parsed.set(file, source);
  return source;
};

const where = (file: string, node: ts.Node) =>
  `${relative(ROOT, file)}:${parse(file).getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

const everyNode = (node: ts.Node): ts.Node[] => [
  node,
  ...node.getChildren().flatMap(everyNode),
];

const text = (node: ts.Node): string | null =>
  ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node)
    ? node.text
    : ts.isTemplateTail(node)
      ? node.text
      : null;

const mentions = (node: ts.Node, needle: string): boolean =>
  everyNode(node).some((n) => text(n)?.includes(needle) === true);

const srcFiles = ["app", "components", "lib", "i18n"].flatMap((d) => walk(join(ROOT, d)));

/** Names of the variables in one file that hold the sign-in path, at any depth. */
const declaredHere = (file: string): ReadonlySet<string> =>
  new Set(
    everyNode(parse(file))
      .filter(ts.isVariableDeclaration)
      .filter((d) => d.initializer !== undefined && mentions(d.initializer, SIGN_IN))
      .map((d) => d.name.getText()),
  );

/**
 * Names of the top-level constants in any file that hold it (a .ts file counts): the only ones
 * another file can import. Matched by name, so a local variable called `path` cannot match.
 */
const sharedConstants: ReadonlySet<string> = new Set(
  srcFiles.flatMap((file) =>
    parse(file)
      .statements.filter(ts.isVariableStatement)
      .flatMap((s) => [...s.declarationList.declarations])
      .filter((d) => d.initializer !== undefined && mentions(d.initializer, SIGN_IN))
      .map((d) => d.name.getText()),
  ),
);

const refersToSignIn = (node: ts.Node, file: string): boolean => {
  const local = declaredHere(file);
  return (
    mentions(node, SIGN_IN) ||
    everyNode(node).some(
      (n) => ts.isIdentifier(n) && (local.has(n.text) || sharedConstants.has(n.text)),
    )
  );
};

const NAVIGATE = new Set(["push", "replace", "assign"]);

/** `file:line` of every place that goes to sign-in without SignInLink. */
function plainSignInLinks(file: string): string[] {
  return everyNode(parse(file)).flatMap((node) => {
    if (ts.isJsxAttribute(node)) {
      const isHref = node.name.getText() === "href" && node.initializer;
      return isHref && refersToSignIn(node.initializer ?? node, file)
        ? [where(file, node)]
        : [];
    }
    if (ts.isPropertyAssignment(node)) {
      // A route object that is not inside a href: it is kept in a constant and passed on later.
      const route =
        node.name.getText() === "pathname" && mentions(node.initializer, SIGN_IN);
      return route && ts.findAncestor(node, ts.isJsxAttribute) === undefined
        ? [where(file, node)]
        : [];
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText().split(".").pop() ?? "";
      const navigates = NAVIGATE.has(callee) && node.expression.getText().includes(".");
      return navigates && node.arguments.some((a) => refersToSignIn(a, file))
        ? [where(file, node)]
        : [];
    }
    return [];
  });
}

describe("links to sign-in", () => {
  const files = srcFiles.filter((f) => !(relative(ROOT, f) in SIGN_IN_ALLOWED));

  test("every allowed exception still exists and still needs its exception", () => {
    for (const path of Object.keys(SIGN_IN_ALLOWED)) {
      const file = join(ROOT, path);
      expect(statSync(file).isFile()).toBe(true);
      expect(plainSignInLinks(file).length).toBeGreaterThan(0);
    }
  });

  test("a page reaches sign-in through SignInLink, so a signup keeps its source", () => {
    expect(files.flatMap(plainSignInLinks)).toEqual([]);
  });

  test("a constant that holds the sign-in path is found in a .ts file, so a link through it is caught", () => {
    expect(sharedConstants.size).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Public pages and the gated pages they link to
// ---------------------------------------------------------------------------------------------

const canonicalExact: ReadonlySet<string> = new Set(CANONICAL_PUBLIC_EXACT);
const underPrefix = (route: string) =>
  CANONICAL_PUBLIC_PREFIXES.some((p) => route === p || route.startsWith(`${p}/`));
const isPublicRoute = (route: string) => canonicalExact.has(route) || underPrefix(route);

/** The canonical route a page file serves: no [locale], no (group). */
const routeOf = (file: string): string => {
  const segments = relative(join(ROOT, "app"), dirname(file))
    .split("/")
    .filter((s) => s !== "" && s !== "[locale]" && !s.startsWith("("));
  return `/${segments.join("/")}`;
};

const localePrefixed = /^\/(?:de|en|nl|fr|it|es|pl|cs|pt|ro)(?=\/|$)/;

const importsOf = (file: string): string[] =>
  parse(file)
    .statements.filter(
      (s): s is ts.ImportDeclaration | ts.ExportDeclaration =>
        (ts.isImportDeclaration(s) || ts.isExportDeclaration(s)) &&
        s.moduleSpecifier !== undefined &&
        ts.isStringLiteral(s.moduleSpecifier),
    )
    .map((s) => (s.moduleSpecifier as ts.StringLiteral).text)
    .flatMap((spec) => {
      const base = spec.startsWith("@/")
        ? join(ROOT, spec.slice(2))
        : spec.startsWith(".")
          ? resolve(dirname(file), spec)
          : null;
      if (base === null) return [];
      const found = [".tsx", ".ts", "/index.tsx", "/index.ts"]
        .map((ext) => `${base}${ext}`)
        .find((candidate) => existsSync(candidate));
      return found ? [found] : [];
    });

/** Every file a public page can render: the page, its layouts, and what they import, transitively. */
function reachableFromPublicPages(): ReadonlySet<string> {
  const appFiles = walk(join(ROOT, "app"));
  // A layout belongs to every route under it, so only a layout outside any route group but (info)
  // counts: (portal)/layout.tsx would otherwise map to "/" and make the whole portal public.
  const publicLayout = (f: string) =>
    f.endsWith("/layout.tsx") &&
    isPublicRoute(routeOf(f)) &&
    !relative(join(ROOT, "app"), f)
      .split("/")
      .some((s) => s.startsWith("(") && s !== "(info)");
  const roots = appFiles.filter(
    (f) => (f.endsWith("/page.tsx") && isPublicRoute(routeOf(f))) || publicLayout(f),
  );
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const next of importsOf(file)) {
      if (
        next.startsWith(join(ROOT, "app")) ||
        next.startsWith(join(ROOT, "components"))
      ) {
        visit(next);
      }
    }
  };
  for (const root of roots) visit(root);
  return seen;
}

/** The static target of a href, or null when it is built at run time. */
function targetOf(init: ts.Node): string | null {
  const fromObject = (o: ts.ObjectLiteralExpression) => {
    const pathname = o.properties.find(
      (p): p is ts.PropertyAssignment =>
        ts.isPropertyAssignment(p) && p.name.getText() === "pathname",
    );
    return pathname ? targetOf(pathname.initializer) : null;
  };
  if (ts.isJsxExpression(init)) return init.expression ? targetOf(init.expression) : null;
  if (ts.isObjectLiteralExpression(init)) return fromObject(init);
  if (ts.isTemplateExpression(init)) return init.head.text;
  return ts.isStringLiteralLike(init) ? init.text : null;
}

const isGated = (target: string): boolean => {
  if (!target.startsWith("/") || target.startsWith("//")) return false;
  const route = target.replace(localePrefixed, "") || "/";
  if (NOT_GATED.some((p) => route === p || route.startsWith(`${p}/`))) return false;
  // A template head such as "/training/" is the start of a public page's path, not a gated one.
  if (target.endsWith("/")) return false;
  return !isPublicRoute(route);
};

/** `file:line  Tag  target` of every plain link from a public page to a gated one. */
function plainGatedLinks(file: string): string[] {
  return everyNode(parse(file)).flatMap((node) => {
    if (!ts.isJsxAttribute(node) || node.name.getText() !== "href" || !node.initializer) {
      return [];
    }
    const target = targetOf(node.initializer);
    const element = node.parent.parent;
    const tag =
      ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element)
        ? element.tagName.getText()
        : "";
    const tracked = tag === "GatedLink" || tag === "SignInLink";
    return target !== null && isGated(target) && !tracked
      ? [`${where(file, node)}  <${tag}>  ${target}`]
      : [];
  });
}

describe("links from public pages to gated pages", () => {
  const reachable = [...reachableFromPublicPages()];

  test("the public pages and what they import are found", () => {
    const names = reachable.map((f) => relative(ROOT, f));
    expect(names).toContain("app/[locale]/(info)/training/nis2-ceo/page.tsx");
    expect(names).toContain("components/training/CourseOutlineList.tsx");
    expect(names).not.toContain("app/[locale]/(portal)/dashboard/page.tsx");
  });

  test("every allowed exception still exists and still needs its exception", () => {
    for (const path of Object.keys(GATED_ALLOWED)) {
      expect(reachable.map((f) => relative(ROOT, f))).toContain(path);
      expect(plainGatedLinks(join(ROOT, path)).length).toBeGreaterThan(0);
    }
  });

  test("a lesson, the walk or the order page is reached through GatedLink, so a signup keeps its source", () => {
    const offenders = reachable
      .filter((f) => !(relative(ROOT, f) in GATED_ALLOWED))
      .flatMap(plainGatedLinks);
    expect(offenders).toEqual([]);
  });
});
