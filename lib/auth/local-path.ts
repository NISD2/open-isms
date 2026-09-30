const BASE = "http://local.invalid";

/**
 * The same-origin path a post-login redirect may go to, or `fallback`.
 *
 * Parsed rather than prefix-matched. `startsWith("/") && !startsWith("//")`
 * accepted "/\evil.tld", which the URL parser (and router.push after it) reads
 * as "//evil.tld" because a backslash is a slash in http URLs, and tabs or
 * newlines inside the string are dropped before parsing. Resolving against a
 * fixed base and requiring that base's origin back catches every spelling the
 * parser accepts, because it is the parser deciding.
 */
export function localCallbackPath(raw: string | null, fallback: string): string {
  const url = raw === null ? null : parse(raw);
  return url?.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : fallback;
}

/** Not URL.canParse: Safari before 17 lacks it, and this runs on the sign-in page. */
function parse(raw: string): URL | null {
  try {
    return new URL(raw, BASE);
  } catch {
    return null;
  }
}
