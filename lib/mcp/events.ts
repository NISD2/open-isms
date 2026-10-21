import "@/lib/server-guard";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { callEvent } from "./call-event";
import type { KeyHolder } from "./context";
import type { ToolOutcome } from "./gates";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Logs the call's event (`callEvent`) once an hour per person, assistant, tool and kind. An
 * assistant pages and retries, and the audit page shows the last 100 rows, so a row per call would
 * push sign-offs and changes off it. The rate limiter's window is the once-an-hour switch: its
 * first hit in a window passes, the rest are denied, in one atomic statement across replicas.
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
