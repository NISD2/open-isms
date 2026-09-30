/**
 * The limiter counts in Postgres. What these tests used to check in memory (a
 * budget per key, the window recovering, cleanup never dropping a live window)
 * is now a property of SQL statements under concurrency, so it is drilled
 * against a real database in scripts/ci/rate-limit-drill.ts.
 *
 * What stays here needs no database: which key and budget a request counts
 * against, and that every caller awaits the answer. The limiter became async,
 * and `if (!rateLimit(...))` on a promise is always false, so a missed await
 * allows every request. TypeScript does not flag `!` on a promise, and Biome's
 * promise rules do not either (checked with 2.5.11), so the last block reads
 * the callers' syntax trees instead.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ts from "typescript";
import { publicRouteBudget, windowKey } from "./rate-limit-rules";

describe("windowKey", () => {
  test("is stable for one key and differs between keys", () => {
    expect(windowKey("login:email:a@example.test")).toBe(
      windowKey("login:email:a@example.test"),
    );
    expect(windowKey("login:email:a@example.test")).not.toBe(
      windowKey("login:email:b@example.test"),
    );
  });

  test("stores 64 characters and none of the key", () => {
    const stored = windowKey(`gap-share:${"t".repeat(500)}`);
    expect(stored).toHaveLength(64);
    expect(stored).not.toContain("gap-share");
    expect(stored).not.toContain("ttt");
  });
});

describe("publicRouteBudget", () => {
  test("a caller with an IP gets its own per-minute budget", () => {
    expect(publicRouteBudget("questionnaire:pdf", "203.0.113.7", 10)).toEqual({
      key: "questionnaire:pdf:203.0.113.7",
      limit: 10,
      windowMs: 60_000,
    });
  });

  test("callers without an IP share one bucket twelve times the size", () => {
    expect(publicRouteBudget("questionnaire:pdf", "unknown", 10)).toEqual({
      key: "questionnaire:pdf:no-client-ip",
      limit: 120,
      windowMs: 60_000,
    });
  });

  test("each route keeps its own shared bucket", () => {
    expect(publicRouteBudget("questionnaire:pdf", "unknown", 10).key).not.toBe(
      publicRouteBudget("questionnaire:docx", "unknown", 10).key,
    );
  });
});

const ROOT = join(import.meta.dir, "..");
const LIMITER = "lib/rate-limit";

type Call = { readonly at: string; readonly awaited: boolean };

const namesLimiter = (file: string, specifier: string): boolean =>
  specifier === `@/${LIMITER}` ||
  (specifier.startsWith(".") && join(dirname(file), specifier) === LIMITER);

const descendants = (node: ts.Node): ts.Node[] =>
  node.getChildren().flatMap((child) => [child, ...descendants(child)]);

const importedNames = (source: ts.SourceFile, file: string): ReadonlySet<string> =>
  new Set(
    source.statements
      .filter(ts.isImportDeclaration)
      .filter(
        (d) =>
          ts.isStringLiteral(d.moduleSpecifier) &&
          namesLimiter(file, d.moduleSpecifier.text),
      )
      .flatMap((d) => {
        const bindings = d.importClause?.namedBindings;
        return bindings && ts.isNamedImports(bindings)
          ? bindings.elements.map((e) => e.name.text)
          : [];
      }),
  );

const callsTo = (source: ts.SourceFile, names: ReadonlySet<string>) =>
  descendants(source)
    .filter(ts.isCallExpression)
    .filter(
      (call) => ts.isIdentifier(call.expression) && names.has(call.expression.text),
    );

/** The name a function is called by in this file, if it has one. */
const enclosingFunctionName = (node: ts.Node): string | undefined => {
  const fn = ts.findAncestor(node.parent, ts.isFunctionLike);
  if (!fn) return undefined;
  if (ts.isFunctionDeclaration(fn)) return fn.name?.text;
  return ts.isVariableDeclaration(fn.parent) && ts.isIdentifier(fn.parent.name)
    ? fn.parent.name.text
    : undefined;
};

/**
 * A named function that calls the limiter is a limiter too (billing's
 * `limited`, llm's `requireLlmBudget`, auth's `isLoginAllowed`): forgetting to
 * await it lets the request through just the same.
 */
const withWrappers = (
  source: ts.SourceFile,
  names: ReadonlySet<string>,
): ReadonlySet<string> => {
  const wrappers = callsTo(source, names)
    .map(enclosingFunctionName)
    .filter((name): name is string => name !== undefined && !names.has(name));
  return wrappers.length === 0
    ? names
    : withWrappers(source, new Set([...names, ...wrappers]));
};

const isAwaited = (call: ts.CallExpression): boolean => {
  const parent = ts.findAncestor(call.parent, (n) => !ts.isParenthesizedExpression(n));
  return parent !== undefined && ts.isAwaitExpression(parent);
};

const lineOf = (source: ts.SourceFile, node: ts.Node): number =>
  source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

function limiterCalls(file: string, text: string): Call[] {
  const imports = ts.preProcessFile(text, true, true).importedFiles;
  if (!imports.some((i) => namesLimiter(file, i.fileName))) return [];
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const names = withWrappers(source, importedNames(source, file));
  return callsTo(source, names).map((call) => ({
    at: `${file}:${lineOf(source, call)}`,
    awaited: isAwaited(call),
  }));
}

/** lib/rate-limit.ts itself is left out: rateLimitPublicRoute returns the promise. */
const callers = (): string[] =>
  ["app", "server", "lib", "components"]
    .flatMap((dir) =>
      [...new Bun.Glob("**/*.{ts,tsx}").scanSync({ cwd: join(ROOT, dir) })].map((f) =>
        join(dir, f),
      ),
    )
    .filter(
      (f) => f !== `${LIMITER}.ts` && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"),
    );

describe("callers of the limiter", () => {
  test("the check catches a missed await, directly and through a wrapper", () => {
    const direct = `import { rateLimit } from "@/lib/rate-limit";
      export async function GET() { if (!rateLimit("k", 1, 1)) return 429; }`;
    const wrapped = `import { rateLimit } from "../rate-limit";
      const limited = async () => { if (!(await rateLimit("k", 1, 1))) throw 429; };
      export async function run() { limited(); }`;
    expect(limiterCalls("app/api/x/route.ts", direct)).toEqual([
      { at: "app/api/x/route.ts:2", awaited: false },
    ]);
    expect(limiterCalls("lib/auth/x.ts", wrapped)).toEqual([
      { at: "lib/auth/x.ts:2", awaited: true },
      { at: "lib/auth/x.ts:3", awaited: false },
    ]);
  });

  test("every call in the codebase is awaited where it is made", () => {
    const calls = callers().flatMap((file) =>
      limiterCalls(file, readFileSync(join(ROOT, file), "utf8")),
    );
    // A floor, not a count: it only proves the scan is finding the callers.
    expect(calls.length).toBeGreaterThan(20);
    expect(calls.filter((c) => !c.awaited).map((c) => c.at)).toEqual([]);
  });
});
