/**
 * The size limit for files written by hand, by a person or an agent, and what the check says when
 * a file breaks it.
 *
 * Size is counted in tokens, as bytes / 4: a budget an agent can hold in its context next to the
 * code that uses the file, not a tokenizer's exact count. 5,000 tokens is about 500 lines of
 * TypeScript. A file nobody can read whole is where duplication and dead code collect, and the
 * cheapest moment to split it is before it grows.
 *
 * About 180 files were already over the limit when the check arrived. Each may stay as large as it
 * is or shrink, never grow, so every change to one of them is a chance to move a part out.
 * Lockfiles, generated output and vendored data are not written by hand and are skipped: they are
 * marked `linguist-generated` or `linguist-vendored` in `.gitattributes`. Datasets that grow one
 * record at a time by design (data/*.json) are marked `size-check-exempt`.
 */

export const TOKEN_LIMIT = 5_000;
const BYTES_PER_TOKEN = 4;

export const tokensOf = (bytes: number): number => Math.ceil(bytes / BYTES_PER_TOKEN);

export const isOverLimit = (bytes: number): boolean => tokensOf(bytes) > TOKEN_LIMIT;

/** A changed file over the limit, with its size before the change. */
export interface OversizedFile {
  readonly path: string;
  readonly bytes: number;
  /** Its size before the change, at its old path when it was renamed. Null for a new file. */
  readonly previousBytes: number | null;
}

export type Verdict =
  /** Over the limit before and no larger now: allowed, so a change that adds nothing waits on no split. */
  | { readonly kind: "not_grown"; readonly tokens: number }
  | {
      readonly kind: "too_large";
      readonly tokens: number;
      readonly previousTokens: number | null;
    };

export const verdictOf = (file: OversizedFile): Verdict => {
  const tokens = tokensOf(file.bytes);
  const { previousBytes } = file;
  return previousBytes !== null &&
    isOverLimit(previousBytes) &&
    file.bytes <= previousBytes
    ? { kind: "not_grown", tokens }
    : {
        kind: "too_large",
        tokens,
        previousTokens: previousBytes === null ? null : tokensOf(previousBytes),
      };
};

const CODE = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"] as const;
const TESTS = [".test.ts", ".test.tsx"] as const;
const PROSE = [".md", ".mdx"] as const;

const endsWithAny = (path: string, endings: readonly string[]): boolean =>
  endings.some((ending) => path.endsWith(ending));

/** `messages/<namespace>/<locale>.json`, the message catalogue `i18n/request.ts` loads. */
const isMessageCatalogue = (path: string): boolean => {
  const parts = path.split("/");
  return parts.length === 3 && parts[0] === "messages" && path.endsWith(".json");
};

/** How to split a file of this kind, as this repository's own conventions do it. */
export const splitAdvice = (path: string): readonly string[] => {
  if (endsWithAny(path, TESTS)) {
    return [
      "Split by the unit under test: one test file per module it exercises, beside that module.",
      "Move shared fixtures and builders into a helper module that the test files import.",
    ];
  }
  if (endsWithAny(path, CODE)) {
    return [
      "Split by responsibility: each cohesive part (a component, the procedures for one resource, a family of helpers, a table of constants) moves to its own module beside this file.",
      "Import the new modules directly where they are used. Do not add a re-export barrel only to keep old import paths working.",
      "Types move with the code that owns them; types shared by several modules get their own module.",
      "Move code unchanged in one commit and change it in the next, so the diff of the split shows only moves.",
    ];
  }
  if (isMessageCatalogue(path)) {
    return [
      "Move one or more top-level keys into a new namespace: messages/<new-namespace>/<locale>.json, for every locale, not only this one.",
      "Add the namespace to `namespaces` in i18n/request.ts, and read it with useTranslations or getTranslations under its new name.",
      "Delete the moved keys from the old namespace in the same commit.",
    ];
  }
  if (path.endsWith(".json")) {
    return [
      "Split by top-level key into one file per concern, and import only the file a caller needs.",
    ];
  }
  if (endsWithAny(path, PROSE)) {
    return [
      "Split by section: each top-level section becomes its own file, and this file keeps a short index that links to them.",
    ];
  }
  return [
    "Split the file by concern into smaller files of the same kind, and update what reads it.",
  ];
};

const formatTokens = (tokens: number): string => tokens.toLocaleString("en-US");

const describe = (verdict: Verdict & { readonly kind: "too_large" }): string =>
  verdict.previousTokens === null
    ? "new file"
    : verdict.previousTokens > TOKEN_LIMIT
      ? `was ${formatTokens(verdict.previousTokens)}, and a file over the limit may not grow`
      : `was ${formatTokens(verdict.previousTokens)}`;

export interface Finding {
  readonly path: string;
  readonly verdict: Verdict;
}

/** What the check prints: errors for files too large, a one-line note for each one that did not grow. */
export const report = (
  findings: readonly Finding[],
): { readonly failed: boolean; readonly lines: readonly string[] } => {
  const tooLarge = findings.flatMap(({ path, verdict }) =>
    verdict.kind === "too_large" ? [{ path, verdict }] : [],
  );
  const notGrown = findings.flatMap(({ path, verdict }) =>
    verdict.kind === "not_grown" ? [{ path, tokens: verdict.tokens }] : [],
  );
  const notes = notGrown.map(
    ({ path, tokens }) =>
      `note: ${path} is ${formatTokens(tokens)} tokens, over the ${formatTokens(TOKEN_LIMIT)} limit. It did not grow, so it passes; moving a part out of it is welcome.`,
  );
  if (tooLarge.length === 0) return { failed: false, lines: notes };

  const count = tooLarge.length === 1 ? "1 file is" : `${tooLarge.length} files are`;
  return {
    failed: true,
    lines: [
      ...notes,
      `error: ${count} over the ${formatTokens(TOKEN_LIMIT)}-token limit (tokens = bytes / 4).`,
      "",
      ...tooLarge.map(
        ({ path, verdict }) =>
          `  ${path}: ${formatTokens(verdict.tokens)} tokens (${describe(verdict)})`,
      ),
      ...tooLarge.flatMap(({ path }) => [
        "",
        `How to split ${path}:`,
        ...splitAdvice(path).map((step, index) => `  ${index + 1}. ${step}`),
      ]),
      "",
      "A file that was already over the limit may stay as large as it is or shrink: move a part out in this commit, then make your change.",
      "A file nobody writes by hand (a lockfile, generated output, vendored data) belongs in .gitattributes as linguist-generated or linguist-vendored, with a comment naming what writes it. A dataset that grows one record at a time is marked size-check-exempt, with a comment saying why.",
    ],
  };
};
