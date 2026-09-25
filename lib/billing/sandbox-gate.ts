/**
 * The one rule that decides whether the manual billing harness exists at all.
 *
 * It lives here rather than in the route so the page and the endpoints cannot drift apart: a page
 * that renders while its endpoint refuses is a bug report, and an endpoint that answers while the
 * page is gone is a hole.
 *
 * The rule is deny by default and derived from the environment rather than from a flag someone
 * might set by accident. The harness is on only when the configured Qonto host IS the sandbox,
 * compared as a parsed hostname so that no other URL that merely contains the sandbox name can
 * switch it on.
 */

export const QONTO_SANDBOX_HOST = "thirdparty-sandbox.staging.qonto.co";

const hostnameOf = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

/** True only when the URL's host is exactly the Qonto sandbox. */
export const isSandboxBase = (url: string | undefined): boolean =>
  hostnameOf(url) === QONTO_SANDBOX_HOST;

export const isSandboxHarnessEnabled = (env: NodeJS.ProcessEnv = process.env): boolean =>
  isSandboxBase(env.QONTO_API_BASE);
