/**
 * How a raw environment string becomes a setting. A leaf with no imports, so lib/env.ts and the
 * config slices it includes (billing, Close) can share it, and it is testable without loading the
 * environment.
 */

/** Trimmed; empty or only whitespace counts as unset, so a copied `KEY=` still gets its default. */
export const trimmed = (v: unknown): unknown =>
  typeof v === "string" ? v.trim() || undefined : v;

/**
 * The environment with every blank value removed. Both compose files pass `${KEY:-}` for each
 * variable the operator left out, which arrives as "", and to zod "" is a value: it wins over a
 * default, fails a number or a pattern, and survives `??`. A value that is set passes through
 * untouched, since a secret or a password is not ours to trim.
 */
export function withoutBlanks(
  source: Readonly<Record<string, string | undefined>>,
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      trimmed(value) === undefined ? undefined : value,
    ]),
  );
}
