import "@/lib/server-guard";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import type { KeyHolder } from "./context";
import type { ToolOutcome } from "./gates";

/** An assistant read the company's data through a tool that changes nothing. */
export const MCP_READ = "mcp.read";
/** An assistant's call was refused, or failed on our side. */
export const MCP_REFUSED = "mcp.refused";

/** What a refusal may add to the row's description; the rest stays in the assistant's answer. */
const MAX_REASON = 300;
const HOUR_MS = 60 * 60 * 1000;

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

/**
 * Logs the call's event once an hour per person, assistant, tool and kind. An assistant pages and
 * retries, and the audit page shows the last 100 rows, so a row per call would push sign-offs and
 * changes off it. The rate limiter's window is the once-an-hour switch: its first hit in a window
 * passes, the rest are denied, in one atomic statement across replicas.
 */
export async function recordCall(
  holder: KeyHolder,
  tool: string,
  outcome: ToolOutcome,
  readOnly: boolean,
): Promise<void> {
  const event = callEvent(tool, outcome, readOnly);
  if (!event) return;
  const once = `mcp-event:${event.action}:${tool}:${holder.userId}:${holder.agent ?? ""}`;
  if (!(await rateLimit(once, 1, HOUR_MS))) return;
  await logAudit({
    companyId: holder.companyId,
    userId: holder.userId,
    action: event.action,
    entityType: "mcp_tool",
    entityId: null,
    description: event.description,
    newValue: { tool },
    ipAddress: holder.ip,
    userAgent: holder.agent,
  });
}
