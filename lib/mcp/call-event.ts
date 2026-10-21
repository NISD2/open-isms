import type { ToolOutcome } from "./gates";

/** An assistant read the company's data through a tool that changes nothing. */
export const MCP_READ = "mcp.read";
/** An assistant's call was refused, or failed on our side. */
export const MCP_REFUSED = "mcp.refused";

/** What a refusal may add to the row's description; the rest stays in the assistant's answer. */
const MAX_REASON = 300;

export type CallEvent = { readonly action: string; readonly description: string };

/**
 * The event a tool call adds to the company's log, or null when the call wrote its own rows: a
 * save goes through the app's procedures, which log every mutation, and a fill adds
 * `mcp.item_filled`. Reads and refusals reach no procedure that logs, so without this the log
 * would not show that an assistant looked at the company's data or was turned away.
 */
export function callEvent(
  tool: string,
  outcome: ToolOutcome,
  readOnly: boolean,
): CallEvent | null {
  if (!outcome.ok)
    return {
      action: MCP_REFUSED,
      description: `${tool}: ${outcome.message.slice(0, MAX_REASON)}`,
    };
  return readOnly ? { action: MCP_READ, description: tool } : null;
}
