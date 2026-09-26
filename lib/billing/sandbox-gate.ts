/**
 * Whether a Qonto base URL is the sandbox, compared as a parsed hostname so that no other URL that
 * merely contains the sandbox name counts. The ordering rule in ./ordering.ts is built on it.
 */

import { QONTO_SANDBOX_HOST } from "./config-schema";

const parse = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

/** The host of an https URL, or null for anything else, including plain http. */
export const httpsHostOf = (url: string): string | null => {
  const u = parse(url);
  return u?.protocol === "https:" ? u.hostname : null;
};

/**
 * True only when the URL is https and its host is exactly the Qonto sandbox. Plain http is
 * refused, because the credentials and the staging token travel in the request headers.
 */
export const isSandboxBase = (url: string): boolean =>
  httpsHostOf(url) === QONTO_SANDBOX_HOST;
