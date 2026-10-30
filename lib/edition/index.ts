import nisd2Only from "./nisd2-only.json";

/**
 * The self-hosted edition (Simon, 25.10.2026): the image a self-hoster pulls is the compliance app
 * alone. nisd2.eu's public site, wiki, docs, courses and supplier portal are left out of it
 * (scripts/self-host-strip.mjs), and a copy redirects their addresses to nisd2.eu (proxy.ts). The
 * source of all of it stays in this repository.
 *
 * Fixed when the image is built (Dockerfile ARG EDITION): Next inlines NEXT_PUBLIC_ values at
 * build time, so an install's own variables cannot switch it.
 */
export const SELF_HOSTED: boolean = process.env.NEXT_PUBLIC_EDITION === "self-host";

export const NISD2_ORIGIN = "https://nisd2.eu";

/** The address a route folder serves: its path below app/ without [locale] and (groups). */
export const routeOf = (folder: string): string =>
  `/${folder
    .split("/")
    .slice(1)
    .filter((s) => s !== "[locale]" && !(s.startsWith("(") && s.endsWith(")")))
    .join("/")}`;

/** The canonical paths (i18n/routing.ts keys) only nisd2.eu serves; each covers the ones below it. */
export const NISD2_ONLY_PATHS: readonly string[] = nisd2Only.pages.map(routeOf);

export const isNisd2Only = (canonicalPath: string): boolean =>
  NISD2_ONLY_PATHS.some((p) => canonicalPath === p || canonicalPath.startsWith(`${p}/`));

/**
 * A link to nisd2.eu for text that leaves the app, such as mail, where no browser sends a
 * referrer: it names the install it came from, so nisd2.eu's analytics can tell installs apart.
 */
export const nisd2Url = (path: string, fromAppUrl: string): string => {
  const url = new URL(path, NISD2_ORIGIN);
  if (URL.canParse(fromAppUrl))
    url.searchParams.set("utm_source", new URL(fromAppUrl).hostname);
  return url.toString();
};
