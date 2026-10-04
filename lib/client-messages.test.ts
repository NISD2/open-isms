import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { clientMessages, PUBLIC_CLIENT_NAMESPACES } from "./client-messages";

/**
 * The locale layout hands the browser only PUBLIC_CLIENT_NAMESPACES. A client component that reads
 * any other namespace on a route outside `AllMessagesProvider` renders its keys instead of its text,
 * and nothing else notices: the types allow it, and the server render of the same text is fine.
 *
 * So this walks every route under app/[locale] that no `AllMessagesProvider` layout covers,
 * follows its imports with the TypeScript compiler, and from the first "use client" module on
 * collects the namespace of every useTranslations() call. A namespace outside the public set, or a
 * namespace computed at runtime that cannot be checked, fails here before it ships.
 */

const ROOT = path.resolve(import.meta.dir, "..");
const LOCALE_DIR = path.join(ROOT, "app/[locale]");
const PROVIDER = path.join(ROOT, "components/AllMessagesProvider.tsx");
const ROUTE_FILES = new Set([
  "page.tsx",
  "layout.tsx",
  "template.tsx",
  "error.tsx",
  "loading.tsx",
  "not-found.tsx",
  "default.tsx",
]);
const PUBLIC = new Set<string>(PUBLIC_CLIENT_NAMESPACES);

const tsconfig = ts.parseJsonConfigFileContent(
  ts.readConfigFile(path.join(ROOT, "tsconfig.json"), ts.sys.readFile).config,
  ts.sys,
  ROOT,
).options;

type Module = {
  readonly client: boolean;
  readonly imports: readonly string[];
  readonly namespaces: readonly string[];
  readonly computed: readonly string[];
};

const resolve = (specifier: string, from: string): string | undefined => {
  const resolved = ts.resolveModuleName(specifier, from, tsconfig, ts.sys).resolvedModule;
  return resolved && !resolved.isExternalLibraryImport
    ? path.resolve(resolved.resolvedFileName)
    : undefined;
};

/** Whether the file's directive prologue, the string statements before any code, says "use client". */
const isUseClient = (source: ts.SourceFile): boolean => {
  for (const statement of source.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) {
      return false;
    }
    if (statement.expression.text === "use client") return true;
  }
  return false;
};

const modules = new Map<string, Module>();

function parse(file: string): Module {
  const cached = modules.get(file);
  if (cached) return cached;
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const imports: string[] = [];
  const namespaces: string[] = [];
  const computed: string[] = [];
  const visit = (node: ts.Node): void => {
    const specifier =
      (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) ||
      ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments[0]
          : undefined;
    const target =
      specifier && ts.isStringLiteral(specifier) && resolve(specifier.text, file);
    if (target) imports.push(target);

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "useTranslations"
    ) {
      const [arg] = node.arguments;
      if (arg && ts.isStringLiteralLike(arg))
        namespaces.push(arg.text.split(".")[0] ?? arg.text);
      else computed.push(node.getText(source));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const parsed = { client: isUseClient(source), imports, namespaces, computed };
  modules.set(file, parsed);
  return parsed;
}

/** Each namespace (or computed call) a route's client modules read, with the module reading it. */
function clientReads(entry: string): { readonly what: string; readonly file: string }[] {
  const seen = new Set<string>();
  const stack = [{ file: entry, client: false }];
  const reads: { what: string; file: string }[] = [];
  for (let next = stack.pop(); next; next = stack.pop()) {
    const mod = parse(next.file);
    const client = next.client || mod.client;
    const key = `${client}:${next.file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (client) {
      const file = path.relative(ROOT, next.file);
      reads.push(...mod.namespaces.map((what) => ({ what, file })));
      reads.push(...mod.computed.map((what) => ({ what, file })));
    }
    stack.push(...mod.imports.map((file) => ({ file, client })));
  }
  return reads;
}

const routeFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(full);
    return ROUTE_FILES.has(entry.name) ? [full] : [];
  });

/** Whether a layout between app/[locale] and this route renders `AllMessagesProvider`. */
const underAllMessages = (route: string): boolean => {
  const dirs = path
    .relative(LOCALE_DIR, path.dirname(route))
    .split(path.sep)
    .filter(Boolean)
    .map((_, i, parts) => path.join(LOCALE_DIR, ...parts.slice(0, i + 1)));
  return dirs.some((dir) => {
    const layout = path.join(dir, "layout.tsx");
    return ts.sys.fileExists(layout) && parse(layout).imports.includes(PROVIDER);
  });
};

const routes = routeFiles(LOCALE_DIR);
const publicRoutes = routes.filter((route) => !underAllMessages(route));

describe("public routes read only the public namespaces on the client", () => {
  test("the walk sees the landing page's own namespace", () => {
    const landing = clientReads(path.join(LOCALE_DIR, "page.tsx")).map((r) => r.what);
    expect(landing).toContain("landing");
  });

  test("the app's routes sit under AllMessagesProvider", () => {
    expect(publicRoutes.length).toBeGreaterThan(0);
    expect(publicRoutes.length).toBeLessThan(routes.length);
  });

  for (const route of publicRoutes) {
    test(path.relative(LOCALE_DIR, route), () => {
      const outside = clientReads(route)
        .filter(({ what }) => !PUBLIC.has(what))
        .map(({ what, file }) => `${file} reads ${what}`);
      // Add the namespace to PUBLIC_CLIENT_NAMESPACES, or render the route under AllMessagesProvider.
      expect(outside).toEqual([]);
    });
  }
});

describe("clientMessages", () => {
  const messages = {
    common: { ok: "OK" },
    portal: { title: "Portal" },
    info: {
      footer: { a: "A" },
      relatedArticles: { b: "B" },
      bsigParagraph38: { body: "long" },
    },
  };

  test("picks the named namespaces and keeps only the client keys of info", () => {
    expect(clientMessages(messages, ["common", "info"])).toEqual({
      common: { ok: "OK" },
      info: { footer: { a: "A" }, relatedArticles: { b: "B" } },
    });
  });

  test("keeps every namespace without a list", () => {
    expect(Object.keys(clientMessages(messages)).sort()).toEqual([
      "common",
      "info",
      "portal",
    ]);
  });
});
