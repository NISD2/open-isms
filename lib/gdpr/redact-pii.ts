/**
 * Free-text PII redaction for GDPR erasure.
 *
 * Its own module because it is a pure function and importing erase-user.ts
 * pulls in environment validation, which made it untestable — and this is the
 * code that decides what survives an erasure, so it is exactly the code that
 * should have tests.
 */
/** Shortest name we will redact on. Below this a name is more likely to be a
 *  fragment of an unrelated word than a match, and over-redaction silently
 *  damages other people's compliance evidence. Emails have no floor: they are
 *  distinctive enough that a substring hit is a real hit. */
const MIN_NAME_NEEDLE = 4;

/** Word-boundary wrapper for a name. \b is ASCII-only in JS, which is wrong for
 *  German: it treats "ü" as a boundary, so "Müller" would not match itself.
 *  Lookarounds on an explicit letter class handle the umlauts and ß. */
const NAME_EDGE = "[A-Za-zÄÖÜäöüßÀ-ÿ0-9_]";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Recursively replace occurrences of the subject's email/name inside the
 *  string leaves of a JSON value. Walks the PARSED structure (not the
 *  serialized text), so values containing quotes, backslashes, or unicode are
 *  still matched — string-replacing over JSON text would miss their escaped
 *  encodings. Literal free-text PII redaction, not code/structure parsing.
 *
 *  Names match on word boundaries, emails anywhere. A bare substring match on a
 *  name is how erasing one person corrupts another's records: since this is now
 *  applied to every frozen sign-off snapshot in the company, a subject called
 *  "Ott" would rewrite "Bottrop", "Schrott" and "Ottomotor" inside a different
 *  employee's evidence, and a snapshot is meant to be the immutable record of
 *  what was signed. Names too short to bound safely are reported as
 *  not-auto-redacted rather than applied. */
export function redactPiiInJson<T>(
  value: T,
  needles: string[],
  opts?: { skipped?: string[] },
): T {
  const patterns = needles
    .map((n) => n?.trim())
    .filter((n): n is string => !!n)
    .flatMap((n) => {
      if (n.includes("@")) return [new RegExp(escapeRe(n), "gi")];
      if (n.length < MIN_NAME_NEEDLE) {
        opts?.skipped?.push(n);
        return [];
      }
      return [
        new RegExp(`(?<!${NAME_EDGE})${escapeRe(n)}(?!${NAME_EDGE})`, "gi"),
      ];
    });
  if (patterns.length === 0) return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") {
      let out = v;
      for (const re of patterns) out = out.replace(re, "[erased]");
      return out;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const src = v as Record<string, unknown>;
      const next: Record<string, unknown> = {};
      for (const k of Object.keys(src)) next[k] = walk(src[k]);
      return next;
    }
    return v;
  };
  return walk(value) as T;
}
