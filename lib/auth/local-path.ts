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
  const url = raw ? parse(raw) : null;
  if (url?.origin !== BASE) return fallback;
  const path = `${url.pathname}${url.search}${url.hash}`;
  // Checked a second time on its own: dot segments can leave an empty first
  // segment ("/.//evil.tld" parses to the path "//evil.tld"), which is
  // protocol-relative the moment it is used without the base.
  return parse(path)?.origin === BASE ? path : fallback;
}

/** Not URL.canParse: Safari before 17 lacks it, and this runs on the sign-in page. */
function parse(raw: string): URL | null {
  try {
    return new URL(raw, BASE);
  } catch {
    return null;
  }
}
