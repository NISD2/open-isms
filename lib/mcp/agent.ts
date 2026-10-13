/**
 * How an audit row says an AI assistant made the change: its user agent is a fixed prefix the
 * client cannot choose, then the name the assistant gave or its own user agent. Written by
 * lib/mcp/context.ts, read by the activity log.
 */
const PREFIX = "mcp: ";

export const assistantAgent = (client: string): string => `${PREFIX}${client}`;

/** The assistant that made an audited change, or null when a person made it in the app. */
export const assistantOf = (userAgent: string | null): string | null =>
  userAgent?.startsWith(PREFIX) ? userAgent.slice(PREFIX.length) : null;
