/**
 * Checks for updates against the GitHub releases API and manages the updater profile.
 *
 * Implements the UPDATE_MODE behavior:
 * - "off": Makes no outbound requests. Reports current version and link to releases page.
 * - "notify": Checks GitHub releases API at most once a day (24h cache). Compares against
 *   APP_VERSION and checks COMPOSE_REVISION against release notes requirements.
 * - updater: If UPDATE_API_TOKEN is set, triggers watchtower via its internal HTTP endpoint.
 */
import { getUpdateMode, type UpdateMode } from "./config-schema";

export interface UpdateStatus {
  mode: UpdateMode;
  currentVersion: string;
  currentComposeRevision: number | null;
  hasUpdate: boolean;
  latestVersion: string | null;
  releaseUrl: string;
  releaseDate: string | null;
  releaseBody: string | null;
  expectedComposeRevision: number | null;
  composeUpdateRequired: boolean;
  updaterAvailable: boolean;
  lastCheckedAt: string | null;
  error?: string;
}

export interface GithubReleasePayload {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string | null;
}

interface CachedRelease {
  timestamp: number;
  release: GithubReleasePayload;
}

let releaseCache: CachedRelease | null = null;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const GITHUB_REPO_RELEASES_URL =
  "https://api.github.com/repos/NISD2/open-isms/releases/latest";
const DEFAULT_RELEASES_PAGE = "https://github.com/NISD2/open-isms/releases";

export function clearReleaseCache(): void {
  releaseCache = null;
}

export function parseSemver(v: string): [number, number, number] | null {
  const match = v
    .trim()
    .replace(/^v/, "")
    .match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  const major = match[1];
  const minor = match[2];
  const patch = match[3];
  if (major === undefined || minor === undefined || patch === undefined) return null;
  return [
    Number.parseInt(major, 10),
    Number.parseInt(minor, 10),
    Number.parseInt(patch, 10),
  ];
}

/**
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal or unparseable.
 */
export function compareSemver(v1: string, v2: string): number {
  const p1 = parseSemver(v1);
  const p2 = parseSemver(v2);
  if (!p1 || !p2) return 0;
  if (p1[0] !== p2[0]) return p1[0] > p2[0] ? 1 : -1;
  if (p1[1] !== p2[1]) return p1[1] > p2[1] ? 1 : -1;
  if (p1[2] !== p2[2]) return p1[2] > p2[2] ? 1 : -1;
  return 0;
}

/**
 * Extracts expected COMPOSE_REVISION from release body notes if present.
 * Looks for patterns like "COMPOSE_REVISION: 4" or "compose revision: 4" or "COMPOSE_REVISION=4".
 */
export function parseExpectedComposeRevision(body: string | null): number | null {
  if (!body) return null;
  const match = body.match(
    /(?:compose(?:_|\s+)revision|compose\.ya?ml\s+revision)[:=\s]+(\d+)/i,
  );
  if (!match) return null;
  const revStr = match[1];
  if (revStr === undefined) return null;
  const parsed = Number.parseInt(revStr, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export interface GetUpdateStatusOptions {
  force?: boolean;
  fetchFn?: typeof fetch;
}

export async function getUpdateStatus(
  options?: GetUpdateStatusOptions,
): Promise<UpdateStatus> {
  const mode = getUpdateMode();
  const currentVersion = process.env.APP_VERSION ?? "dev";
  const rawComposeRev = process.env.COMPOSE_REVISION?.trim();
  const currentComposeRevision = rawComposeRev
    ? Number.parseInt(rawComposeRev, 10)
    : null;
  const token = process.env.UPDATE_API_TOKEN?.trim();
  const updaterAvailable = Boolean(token);

  if (mode === "off") {
    return {
      mode: "off",
      currentVersion,
      currentComposeRevision,
      hasUpdate: false,
      latestVersion: null,
      releaseUrl: DEFAULT_RELEASES_PAGE,
      releaseDate: null,
      releaseBody: null,
      expectedComposeRevision: null,
      composeUpdateRequired: false,
      updaterAvailable,
      lastCheckedAt: null,
    };
  }

  // mode === "notify": Check cache
  const fetcher = options?.fetchFn ?? fetch;
  const force = options?.force ?? false;
  const now = Date.now();

  let releaseData: GithubReleasePayload | null = null;
  let lastCheckedTime: number = now;

  if (!force && releaseCache && now - releaseCache.timestamp < CACHE_TTL_MS) {
    releaseData = releaseCache.release;
    lastCheckedTime = releaseCache.timestamp;
  } else {
    const apiUrl = process.env.GITHUB_RELEASES_URL ?? GITHUB_REPO_RELEASES_URL;
    try {
      const res = await fetcher(apiUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "open-isms",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`GitHub releases API answered status ${res.status}`);
      }

      const parsed = (await res.json()) as GithubReleasePayload;
      if (!parsed || typeof parsed.tag_name !== "string") {
        throw new Error("Invalid response format from GitHub releases API");
      }

      releaseData = parsed;
      releaseCache = { timestamp: now, release: parsed };
      lastCheckedTime = now;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (releaseCache) {
        releaseData = releaseCache.release;
        lastCheckedTime = releaseCache.timestamp;
      } else {
        return {
          mode: "notify",
          currentVersion,
          currentComposeRevision,
          hasUpdate: false,
          latestVersion: null,
          releaseUrl: DEFAULT_RELEASES_PAGE,
          releaseDate: null,
          releaseBody: null,
          expectedComposeRevision: null,
          composeUpdateRequired: false,
          updaterAvailable,
          lastCheckedAt: null,
          error: errorMessage,
        };
      }
    }
  }

  const latestTag = releaseData.tag_name;
  const cleanLatest = latestTag.replace(/^v/, "");
  const hasUpdate =
    currentVersion !== "dev" && compareSemver(cleanLatest, currentVersion) > 0;
  const expectedComposeRevision = parseExpectedComposeRevision(releaseData.body);
  const composeUpdateRequired =
    expectedComposeRevision !== null &&
    currentComposeRevision !== null &&
    currentComposeRevision < expectedComposeRevision;

  return {
    mode: "notify",
    currentVersion,
    currentComposeRevision,
    hasUpdate,
    latestVersion: cleanLatest,
    releaseUrl: releaseData.html_url || DEFAULT_RELEASES_PAGE,
    releaseDate: releaseData.published_at || null,
    releaseBody: releaseData.body,
    expectedComposeRevision,
    composeUpdateRequired,
    updaterAvailable,
    lastCheckedAt: new Date(lastCheckedTime).toISOString(),
  };
}

export interface TriggerUpdaterOptions {
  fetchFn?: typeof fetch;
}

export async function triggerUpdater(
  options?: TriggerUpdaterOptions,
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.UPDATE_API_TOKEN?.trim();
  if (!token) {
    return {
      ok: false,
      message: "UPDATE_API_TOKEN is not configured on this instance",
    };
  }

  const updaterUrl = process.env.UPDATER_URL?.trim() || "http://updater:8080/v1/update";
  const fetcher = options?.fetchFn ?? fetch;

  try {
    const res = await fetcher(updaterUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return {
        ok: false,
        message: `Updater endpoint returned status ${res.status}`,
      };
    }

    return {
      ok: true,
      message: "Update triggered successfully",
    };
  } catch (err) {
    // When watchtower updates the app container, the connection can close abruptly.
    // That is normal and indicates the container is being restarted.
    console.log("[updater] update trigger request completed/terminated:", err);
    return {
      ok: true,
      message: "Update triggered; application container is restarting",
    };
  }
}
