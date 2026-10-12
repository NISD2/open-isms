import "@/lib/server-guard";
import {
  type CallToolResult,
  createMcpHandler,
  McpServer,
} from "@modelcontextprotocol/server";
import { rateLimit } from "@/lib/rate-limit";
import { loggableFailure } from "@/lib/trpc/loggable-failure";
import type { KeyHolder } from "./context";
import { describeError } from "./errors";
import {
  FillItemInput,
  fillItem,
  GetWalkthroughInput,
  getWalkthrough,
  type ToolOutcome,
} from "./tools";

const INSTRUCTIONS = [
  "nisd2.eu guides a company through implementing NIS2, one item at a time: the walkthrough.",
  "get_walkthrough lists the company's items with where each stands. With a code it returns one item in full: its own words, its fields with their JSON schema and current answers, and its register with the rows already in it.",
  "fill_walkthrough_item saves answers to an item's fields and adds rows to its register, checked the way the app checks them.",
  "Fill in only what the company's own documents and systems show, and leave a field empty rather than guess.",
  "Nothing here finishes, decides or signs an item: the person finishes each item in the app, and management signs it there. Each item carries its link.",
  "Some screens take input only in the app (assets, ratings, policies, approvals); get_walkthrough names them per item.",
].join(" ");

/** Calls one person's assistants may make per hour, together. */
const CALLS_PER_HOUR = 300;
const HOUR_MS = 60 * 60 * 1000;

const toResult = (outcome: ToolOutcome): CallToolResult =>
  outcome.ok
    ? { content: [{ type: "text", text: JSON.stringify(outcome.data, null, 2) }] }
    : { content: [{ type: "text", text: outcome.message }], isError: true };

/**
 * Every tool call: the hourly limit, a log line naming the tool and the person (never what was
 * sent), and a refusal the assistant can read. An unexpected error stays in our log.
 */
function guarded<I>(
  tool: string,
  holder: KeyHolder,
  run: (holder: KeyHolder, input: I) => Promise<ToolOutcome>,
): (input: I) => Promise<CallToolResult> {
  return async (input) => {
    console.info(JSON.stringify({ event: "mcp_tool", tool, userId: holder.userId }));
    try {
      if (!(await rateLimit(`mcp:${holder.userId}`, CALLS_PER_HOUR, HOUR_MS))) {
        return toResult({
          ok: false,
          message: "Too many calls in the last hour. Try again later.",
        });
      }
      return toResult(await run(holder, input));
    } catch (error) {
      const message = describeError(error);
      if (message) return toResult({ ok: false, message });
      // As the tRPC route logs an unexpected error: the stack, never the input or a query's values.
      console.error(
        `[mcp] ${tool} failed:`,
        error instanceof Error ? loggableFailure(error) : error,
      );
      return toResult({
        ok: false,
        message: "Something went wrong on the server. Try again in a moment.",
      });
    }
  };
}

/** One server per request, bound to the key's holder; nothing outlives the request. */
function buildServer(holder: KeyHolder): McpServer {
  const server = new McpServer(
    { name: "nisd2", version: "1.0.0" },
    { instructions: INSTRUCTIONS },
  );

  server.registerTool(
    "get_walkthrough",
    {
      title: "Read the NIS2 walkthrough",
      description:
        "Lists every item of the company's NIS2 walkthrough with its state, or, with a code, one item in full: its words, its fields with their JSON schema and current answers, and its register with its rows.",
      inputSchema: GetWalkthroughInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    guarded("get_walkthrough", holder, getWalkthrough),
  );

  server.registerTool(
    "fill_walkthrough_item",
    {
      title: "Fill in a walkthrough item",
      description:
        "Saves answers to an item's fields and adds rows to its register, checked as the app checks them. Never finishes, decides or signs the item, and refuses an item management has signed. Returns what was saved and what is still empty.",
      inputSchema: FillItemInput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    guarded("fill_walkthrough_item", holder, fillItem),
  );

  return server;
}

/**
 * Serves one request whose key the endpoint verified. Stateless on both protocol generations, and
 * whole JSON answers, since no tool streams progress. Nothing here pushes a notification, so no
 * subscription is held open.
 */
export const serveMcp = (request: Request, holder: KeyHolder): Promise<Response> =>
  createMcpHandler(() => buildServer(holder), {
    responseMode: "json",
    maxSubscriptions: 0,
  }).fetch(request);
