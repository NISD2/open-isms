/**
 * How an audit row says an AI assistant made the change: its user agent is a fixed prefix, then
 * the name the assistant gave or its own user agent. Written by lib/mcp/context.ts, read by the
 * activity log. A browser's user agent passes through `browserAgent`, so the prefix comes only
 * from a key.
 */
const PREFIX = "mcp: ";

/**
 * The user agent of a change made with a key: the name the person allowed, else the assistant's
 * own user agent, else "key". Never blank, which the log would read as no assistant at all.
 */
export const assistantAgent = (
  client: string | undefined,
  userAgent: string | null,
): string => `${PREFIX}${client?.trim() || userAgent?.trim() || "key"}`;

/** The assistant that made an audited change, or null when a person made it in the app. */
export const assistantOf = (userAgent: string | null): string | null =>
  userAgent?.startsWith(PREFIX) ? userAgent.slice(PREFIX.length) : null;

/**
 * A user agent a signed-in browser sent, as its audit rows store it. One that starts like an
 * assistant's is kept, behind a marker, so a person cannot make their own change read as one an
 * assistant made.
 */
export const browserAgent = (userAgent: string | null): string | null =>
  assistantOf(userAgent) === null ? userAgent : `browser: ${userAgent}`;
