/**
 * Inline JSON-LD <script> tag.
 *
 * Why the escape: JSON.stringify does not escape "<", so a payload
 * containing "</script>" (or any "<") would close the script tag
 * early and the rest would be parsed as HTML — XSS vector. Replacing
 * "<" with the unicode escape keeps the payload inside the script
 * block. Same mitigation as serialize-javascript and the Next.js
 * docs use.
 *
 * U+2028 / U+2029 are also escaped because some older parsers treat
 * them as JS line terminators inside string literals (would break the
 * JSON parse, not a security hole, but cheap to fix here).
 */

// Built via RegExp constructor with the unicode escape inside the
// source string so the TypeScript tokenizer never sees the literal
// line-terminator characters.
const LINE_SEP_RE = new RegExp("\\u2028", "g");
const PARA_SEP_RE = new RegExp("\\u2029", "g");

function safeStringify(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(LINE_SEP_RE, "\\u2028")
    .replace(PARA_SEP_RE, "\\u2029");
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeStringify(data) }}
    />
  );
}
