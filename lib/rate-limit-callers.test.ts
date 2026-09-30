/**
 * The limiter is async, and a promise used as a boolean is always truthy, so
 * `if (!rateLimit(...))` never limits anything. TypeScript does not flag `!` on
 * a promise and Biome's promise rules do not either (checked with 2.5.11), so
 * this reads the syntax tree of every TypeScript file in the repository.
 *
 * Tracked: rateLimit and rateLimitPublicRoute from lib/rate-limit.ts, and every
 * function that calls something tracked, followed across files through imports,
 * re-exports and namespace imports: named functions and const arrows by name,
 * methods by member name. Imports resolve with TypeScript's own resolver and the
 * repository's tsconfig. A tracked call has to be awaited, returned (which makes
 * the enclosing function tracked too), or handed on as an argument or array
 * element. Dropped, negated, tested, compared or stored, it fails.
 *
 * Syntax, not types: a tracked method name also matches other methods of that
 * name in the files that import its module, and a promise handed to an anonymous
 * callback (`keys.map((k) => rateLimit(k, 1, 1))`) leaves the analysis there.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const ROOT = join(import.meta.dir, "..");
const LIMITER = "lib/rate-limit.ts";
const SEEDS: ReadonlySet<string> = new Set(["rateLimit", "rateLimitPublicRoute"]);
const NONE: ReadonlySet<string> = new Set();

type Files = ReadonlyMap<string, string>;
/** Module path to the names it exports (or defines, for members) that are tracked. */
type Tracked = ReadonlyMap<string, ReadonlySet<string>>;
type State = { readonly exports: Tracked; readonly members: Tracked };
type Names = {
  readonly identifiers: ReadonlySet<string>;
  readonly namespaces: ReadonlyMap<string, ReadonlySet<string>>;
  readonly members: ReadonlySet<string>;
};
type Handle = {
  readonly kind: "name" | "member";
  readonly name: string;
  readonly exportedAs?: string;
};
type Binding = {
  readonly local: string;
  readonly module: string;
  readonly imported: string;
};
type Call = { readonly at: string; readonly handedOn: boolean };

const compilerOptions = ts.parseJsonConfigFileContent(
  ts.readConfigFile(join(ROOT, "tsconfig.json"), ts.sys.readFile).config,
  {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: () => [],
  },
  ROOT,
).options;

const resolverFor = (files: Files) => {
  const host: ts.ModuleResolutionHost = {
    fileExists: (path) => files.has(relative(ROOT, path)),
    readFile: (path) => files.get(relative(ROOT, path)),
  };
  const cache = ts.createModuleResolutionCache(ROOT, (name) => name, compilerOptions);
  return (specifier: string, file: string): string | undefined => {
    const { resolvedModule } = ts.resolveModuleName(
      specifier,
      join(ROOT, file),
      compilerOptions,
      host,
      cache,
    );
    return resolvedModule && relative(ROOT, resolvedModule.resolvedFileName);
  };
};

const childrenOf = (node: ts.Node): ts.Node[] => {
  const children: ts.Node[] = [];
  ts.forEachChild(node, (child) => {
    children.push(child);
  });
  return children;
};

const callsIn = (node: ts.Node): ts.CallExpression[] => [
  ...(ts.isCallExpression(node) ? [node] : []),
  ...childrenOf(node).flatMap(callsIn),
];

type Parsed = { readonly source: ts.SourceFile; readonly calls: ts.CallExpression[] };

const parserFor = (files: Files) => {
  const parsed = new Map<string, Parsed>();
  return (file: string): Parsed => {
    const cached = parsed.get(file);
    if (cached) return cached;
    const source = ts.createSourceFile(
      file,
      files.get(file) ?? "",
      ts.ScriptTarget.Latest,
      true,
    );
    const fresh = { source, calls: callsIn(source) };
    parsed.set(file, fresh);
    return fresh;
  };
};

const bindingsOf = (
  source: ts.SourceFile,
  file: string,
  resolve: (specifier: string, file: string) => string | undefined,
): Binding[] =>
  source.statements.filter(ts.isImportDeclaration).flatMap((decl) => {
    const clause = decl.importClause;
    const module = ts.isStringLiteral(decl.moduleSpecifier)
      ? resolve(decl.moduleSpecifier.text, file)
      : undefined;
    if (!clause || clause.isTypeOnly || module === undefined) return [];
    const named = clause.namedBindings;
    return [
      ...(clause.name ? [{ local: clause.name.text, module, imported: "default" }] : []),
      ...(named && ts.isNamespaceImport(named)
        ? [{ local: named.name.text, module, imported: "*" }]
        : []),
      ...(named && ts.isNamedImports(named)
        ? named.elements
            .filter((e) => !e.isTypeOnly)
            .map((e) => ({
              local: e.name.text,
              module,
              imported: (e.propertyName ?? e.name).text,
            }))
        : []),
    ];
  });

const isTracked = (call: ts.CallExpression, names: Names): boolean => {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) return names.identifiers.has(callee.text);
  if (!ts.isPropertyAccessExpression(callee)) return false;
  const member = callee.name.text;
  const namespace = ts.isIdentifier(callee.expression)
    ? names.namespaces.get(callee.expression.text)
    : undefined;
  return namespace?.has(member) === true || names.members.has(member);
};

const exportedAs = (decl: ts.Declaration, name: string): string | undefined => {
  const flags = ts.getCombinedModifierFlags(decl);
  if (!(flags & ts.ModifierFlags.Export)) return undefined;
  return flags & ts.ModifierFlags.Default ? "default" : name;
};

const memberName = (name: ts.PropertyName): string | undefined =>
  ts.isIdentifier(name) || ts.isPrivateIdentifier(name) || ts.isStringLiteral(name)
    ? name.text
    : undefined;

const member = (name: string | undefined): Handle | undefined =>
  name === undefined ? undefined : { kind: "member", name };

/** How the rest of the code calls this function, if it can be called by name at all. */
const handleOf = (fn: ts.SignatureDeclaration): Handle | undefined => {
  if (ts.isFunctionDeclaration(fn)) {
    return (
      fn.name && {
        kind: "name",
        name: fn.name.text,
        exportedAs: exportedAs(fn, fn.name.text),
      }
    );
  }
  if (ts.isMethodDeclaration(fn)) return member(memberName(fn.name));
  if (!ts.isArrowFunction(fn) && !ts.isFunctionExpression(fn)) return undefined;
  const holder = fn.parent;
  if (ts.isVariableDeclaration(holder) && ts.isIdentifier(holder.name)) {
    const name = holder.name.text;
    return { kind: "name", name, exportedAs: exportedAs(holder, name) };
  }
  if (ts.isPropertyAssignment(holder) || ts.isPropertyDeclaration(holder)) {
    return member(memberName(holder.name));
  }
  return undefined;
};

/** Grows `names` by every function in the file that calls something in it. */
const expand = (parsed: Parsed, names: Names): { names: Names; handles: Handle[] } => {
  const handles = parsed.calls
    .filter((call) => isTracked(call, names))
    .flatMap((call) => {
      const fn = ts.findAncestor(call.parent, ts.isFunctionLike);
      const handle = fn && handleOf(fn);
      return handle ? [handle] : [];
    });
  const next: Names = {
    ...names,
    identifiers: new Set([
      ...names.identifiers,
      ...handles.filter((h) => h.kind === "name").map((h) => h.name),
    ]),
    members: new Set([
      ...names.members,
      ...handles.filter((h) => h.kind === "member").map((h) => h.name),
    ]),
  };
  const grew =
    next.identifiers.size > names.identifiers.size ||
    next.members.size > names.members.size;
  return grew ? expand(parsed, next) : { names, handles };
};

/** Tracked names this file exports under names of its own, and through re-exports. */
const exportsOf = (
  source: ts.SourceFile,
  file: string,
  names: Names,
  handles: Handle[],
  tracked: (module: string) => ReadonlySet<string>,
  resolve: (specifier: string, file: string) => string | undefined,
): string[] => [
  ...handles.flatMap((h) => (h.exportedAs ? [h.exportedAs] : [])),
  ...source.statements.flatMap((statement) => {
    if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression)) {
      return names.identifiers.has(statement.expression.text) ? ["default"] : [];
    }
    if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) return [];
    const from =
      statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
        ? resolve(statement.moduleSpecifier.text, file)
        : undefined;
    const clause = statement.exportClause;
    if (clause === undefined) return from ? [...tracked(from)] : [];
    if (!ts.isNamedExports(clause)) return [];
    return clause.elements
      .filter((e) => {
        const local = (e.propertyName ?? e.name).text;
        return from ? tracked(from).has(local) : names.identifiers.has(local);
      })
      .map((e) => e.name.text);
  }),
];

type Facts = {
  readonly exports: string[];
  readonly members: string[];
  readonly calls: Call[];
};

const outermost = (node: ts.Node): ts.Node =>
  ts.isParenthesizedExpression(node.parent) ? outermost(node.parent) : node;

const handedOn = (call: ts.CallExpression): boolean => {
  const node = outermost(call);
  const use = node.parent;
  return (
    ts.isAwaitExpression(use) ||
    ts.isReturnStatement(use) ||
    (ts.isArrowFunction(use) && use.body === node) ||
    ts.isArrayLiteralExpression(use) ||
    ((ts.isCallExpression(use) || ts.isNewExpression(use)) && use.expression !== node)
  );
};

function analyse(files: Files): Call[] {
  const resolve = resolverFor(files);
  const parse = parserFor(files);
  const importsOf = new Map(
    [...files].map(([file, text]) => [
      file,
      ts
        .preProcessFile(text, true, true)
        .importedFiles.flatMap((i) => resolve(i.fileName, file) ?? []),
    ]),
  );

  const relevant = (state: State): string[] => {
    const modules = new Set([...state.exports.keys(), ...state.members.keys()]);
    return [...files.keys()].filter(
      (file) =>
        modules.has(file) || (importsOf.get(file) ?? []).some((m) => modules.has(m)),
    );
  };

  const factsOf = (file: string, state: State): Facts => {
    const parsed = parse(file);
    const tracked = (module: string) => state.exports.get(module) ?? NONE;
    const bindings = bindingsOf(parsed.source, file, resolve);
    const seed: Names = {
      identifiers: new Set([
        ...tracked(file),
        ...bindings
          .filter((b) => b.imported !== "*" && tracked(b.module).has(b.imported))
          .map((b) => b.local),
      ]),
      namespaces: new Map(
        bindings
          .filter((b) => b.imported === "*")
          .map((b) => [b.local, tracked(b.module)]),
      ),
      members: new Set(
        [file, ...bindings.map((b) => b.module)].flatMap((m) => [
          ...(state.members.get(m) ?? NONE),
        ]),
      ),
    };
    const { names, handles } = expand(parsed, seed);
    return {
      exports: exportsOf(parsed.source, file, names, handles, tracked, resolve),
      members: handles.filter((h) => h.kind === "member").map((h) => h.name),
      calls: parsed.calls
        .filter((call) => isTracked(call, names))
        .map((call) => ({
          at: `${file}:${parsed.source.getLineAndCharacterOfPosition(call.getStart(parsed.source)).line + 1}`,
          handedOn: handedOn(call),
        })),
    };
  };

  const merged = (
    base: Tracked,
    more: ReadonlyArray<readonly [string, string[]]>,
  ): Tracked => {
    const next = new Map([...base].map(([module, names]) => [module, new Set(names)]));
    for (const [module, names] of more) {
      next.set(module, new Set([...(next.get(module) ?? NONE), ...names]));
    }
    return next;
  };

  const size = (state: State) =>
    [...state.exports.values(), ...state.members.values()].reduce(
      (n, s) => n + s.size,
      0,
    );

  const settle = (state: State): State => {
    const facts = relevant(state).map((file) => [file, factsOf(file, state)] as const);
    const next: State = {
      exports: merged(
        state.exports,
        facts.map(([file, f]) => [file, f.exports]),
      ),
      members: merged(
        state.members,
        facts.map(([file, f]) => [file, f.members]),
      ),
    };
    return size(next) === size(state) ? state : settle(next);
  };

  const settled = settle({ exports: new Map([[LIMITER, SEEDS]]), members: new Map() });
  return relevant(settled).flatMap((file) => factsOf(file, settled).calls);
}

const repoFiles = (): Files => {
  const listed = Bun.spawnSync(
    [
      "git",
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "*.ts",
      "*.tsx",
    ],
    { cwd: ROOT },
  )
    .stdout.toString()
    .split("\0")
    .filter((file) => file !== "" && existsSync(join(ROOT, file)));
  return new Map(listed.map((file) => [file, readFileSync(join(ROOT, file), "utf8")]));
};

const lines = (...rows: string[]) => rows.join("\n");

const FIXTURE: Files = new Map([
  [
    "lib/rate-limit.ts",
    lines(
      "export async function rateLimit(key: string, limit: number, windowMs: number) { return key !== '' && limit > windowMs; }",
      "export function rateLimitPublicRoute(ip: string) { return rateLimit(ip, 1, 1); }",
    ),
  ],
  [
    "lib/guard.ts",
    lines(
      'import { rateLimit } from "./rate-limit";',
      "export const guard = async (ip: string) => rateLimit(ip, 1, 1);",
      "export const limiter = {",
      "  async allow(ip: string) {",
      "    return await rateLimit(ip, 1, 1);",
      "  },",
      "};",
    ),
  ],
  [
    "app/api/x/route.ts",
    lines(
      'import { rateLimit } from "@/lib/rate-limit";',
      "export async function GET() {",
      '  if (!rateLimit("k", 1, 1)) return 429;',
      '  const pending = rateLimit("k", 1, 1);',
      "  return pending;",
      "}",
    ),
  ],
  [
    "proxy.ts",
    lines(
      'import { guard, limiter } from "./lib/guard";',
      "export async function proxy(ip: string) {",
      "  if (!guard(ip)) return 429;",
      "  if (!limiter.allow(ip)) return 429;",
      "  return (await guard(ip)) ? 200 : 429;",
      "}",
    ),
  ],
  [
    "scripts/job.ts",
    lines(
      'import * as limits from "../lib/rate-limit";',
      'limits.rateLimitPublicRoute("203.0.113.7");',
      'export const allowed = await limits.rateLimit("k", 1, 1);',
    ),
  ],
  [
    "e2e/uses-proxy.ts",
    lines('import { proxy } from "../proxy";', 'proxy("203.0.113.7");'),
  ],
]);

describe("callers of the limiter", () => {
  test("follows wrappers across files, methods and namespace imports, into root files and scripts", () => {
    const calls = analyse(FIXTURE);
    const where = (handed: boolean) =>
      calls
        .filter((c) => c.handedOn === handed)
        .map((c) => c.at)
        .sort();
    expect(where(false)).toEqual([
      "app/api/x/route.ts:3",
      "app/api/x/route.ts:4",
      "e2e/uses-proxy.ts:2",
      "proxy.ts:3",
      "proxy.ts:4",
      "scripts/job.ts:2",
    ]);
    expect(where(true)).toEqual([
      "lib/guard.ts:2",
      "lib/guard.ts:5",
      "lib/rate-limit.ts:2",
      "proxy.ts:5",
      "scripts/job.ts:3",
    ]);
  });

  test("every call in the repository is awaited, returned or handed on", () => {
    const calls = analyse(repoFiles());
    // A floor, not a count: it only proves the scan is finding the callers.
    expect(calls.length).toBeGreaterThan(30);
    expect(calls.filter((c) => !c.handedOn).map((c) => c.at)).toEqual([]);
  });
});
