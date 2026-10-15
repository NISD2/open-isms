/** Where the consent page lives; its own file so the portal's client code can read it too. */
const CONSENT_ROOT = "/mcp/verbinden";

/**
 * The consent page for a checked request. The request rides in the path, not the query: the
 * proxy keeps only the path when it sends a signed-out person to sign in and back.
 */
export const consentPath = (request: string): string => `${CONSENT_ROOT}/${request}`;

/** Whether a portal path (locale already removed) is the consent page. */
export const isConsentPath = (path: string): boolean =>
  path.startsWith(`${CONSENT_ROOT}/`);
