import { routing } from "./routing";

type PathnameMapping = string | Partial<Record<string, string>>;

/**
 * Expand canonical (DE-keyed) paths and prefixes to all their locale variants via
 * routing.pathnames. Resolves the localized-slug blocker found during PR #14 review:
 * `/datenschutz` is canonical, but EN/NL users hit `/privacy` and the proxy never saw it; same for
 * `/toepasselijkheid`, `/leveranciersportaal`, `/author/[slug]`, etc.
 */
export function expandPaths(
  canonicalExact: readonly string[],
  canonicalPrefixes: readonly string[],
): { exact: ReadonlySet<string>; prefixes: readonly string[] } {
  const pathnames = routing.pathnames as Record<string, PathnameMapping>;
  const exact = new Set<string>();
  const prefixes = new Set<string>();

  for (const canonical of canonicalExact) {
    exact.add(canonical);
    const mapping = pathnames[canonical];
    if (mapping && typeof mapping === "object") {
      for (const localized of Object.values(mapping)) {
        if (localized) exact.add(localized);
      }
    }
  }

  for (const canonical of canonicalPrefixes) {
    prefixes.add(canonical);
    // Walk all routing entries: when a canonical key sits under this
    // prefix and the entry is localized, derive the localized prefix
    // root by stripping the trailing suffix shared with the canonical
    // key. e.g. canonical="/autor", key="/autor/simon-orzel",
    // mapping.en="/author/simon-orzel" → localized prefix "/author".
    for (const [key, mapping] of Object.entries(pathnames)) {
      const isUnderPrefix = key === canonical || key.startsWith(`${canonical}/`);
      if (!isUnderPrefix) continue;
      if (!mapping || typeof mapping !== "object") continue;
      const suffix = key.slice(canonical.length);
      for (const localized of Object.values(mapping)) {
        if (!localized) continue;
        if (suffix && !localized.endsWith(suffix)) continue;
        const localizedRoot = suffix ? localized.slice(0, -suffix.length) : localized;
        if (localizedRoot) prefixes.add(localizedRoot);
      }
    }
  }

  return { exact, prefixes: [...prefixes] };
}

/** Whether a locale-stripped path is one of the prefixes or below one. */
export const underAny = (path: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
