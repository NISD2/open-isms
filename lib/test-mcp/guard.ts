import type { CallToolResult } from "@modelcontextprotocol/server";
import { loggableFailure } from "@/lib/trpc/loggable-failure";
import type { TestHolder } from "./context";
import { cleanReplacer } from "./sanitize";

/** The longest answer, in characters. A page of a log is fitted to it (page.ts), never cut. */
export const MAX_CHARS = 60_000;

const CALLS_PER_HOUR = 600;
/** The tools that read whole tables or many companies; they get a smaller hourly budget. */
const HEAVY_CALLS_PER_HOUR = 30;
const HOUR_MS = 60 * 60 * 1000;

/** What an answer looks like as text: every string cleaned, pretty-printed. */
export const serialize = (data: unknown): string =>
  JSON.stringify(data, cleanReplacer, 1);

export const text = (data: unknown): CallToolResult => {
  const json = serialize(data);
  return {
    content: [
      {
        type: "text",
        text:
          json.length > MAX_CHARS
            ? `${json.slice(0, MAX_CHARS)}\n…cut at ${MAX_CHARS} characters: narrow the dates or filters.`
            : json,
      },
    ],
  };
};

export const refused = (message: string): CallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

/** What the guard needs from outside, so its order of work is testable without a database. */
export interface GuardDeps {
  /** True while the key has calls left in the window. */
  readonly rateLimit: (key: string, limit: number, windowMs: number) => Promise<boolean>;
  /** Writes the audit row of a read; throws when it cannot. */
  readonly record: (holder: TestHolder, tool: string, input: object) => Promise<void>;
}

/**
 * Every call: the hourly limits, a row in the audit log saying who looked at what (the input, as
 * the row keeps it, never the answer) that must be written before anything is read, and a plain
 * refusal on failure. An unexpected error stays in our log.
 */
export const createGuard =
  (deps: GuardDeps) =>
  <I extends object>(
    tool: string,
    holder: TestHolder,
    run: (input: I) => Promise<CallToolResult>,
    weight: "light" | "heavy" = "light",
  ): ((input: I) => Promise<CallToolResult>) =>
  async (input) => {
    try {
      if (!(await deps.rateLimit(`test-mcp:${holder.userId}`, CALLS_PER_HOUR, HOUR_MS))) {
        return refused("Too many calls in the last hour.");
      }
      if (
        weight === "heavy" &&
        !(await deps.rateLimit(
          `test-mcp-heavy:${holder.userId}`,
          HEAVY_CALLS_PER_HOUR,
          HOUR_MS,
        ))
      ) {
        return refused("Too many large lookups in the last hour.");
      }
      // Throws when the row cannot be written, and then nothing is read.
      await deps.record(holder, tool, input);
      return await run(input);
    } catch (error) {
      console.error(
        `[test] ${tool} failed:`,
        error instanceof Error ? loggableFailure(error) : error,
      );
      return refused("Something went wrong. Try again in a moment.");
    }
  };
