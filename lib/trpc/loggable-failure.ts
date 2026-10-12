import { DrizzleQueryError } from "drizzle-orm";

/** The first database error in a cause chain, if there is one within a few links. */
const queryErrorIn = (error: unknown, depth = 0): DrizzleQueryError | null =>
  error instanceof DrizzleQueryError
    ? error
    : depth < 4 && error instanceof Error
      ? queryErrorIn(error.cause, depth + 1)
      : null;

const fieldOf = (value: unknown, key: "code" | "constraint" | "table" | "column") =>
  value && typeof value === "object" && key in value
    ? String((value as Record<string, unknown>)[key])
    : undefined;

/**
 * An unexpected error as the log keeps it. A database failure is logged by name, Postgres code,
 * constraint and query text, never by message: drizzle's message carries the bound parameters, and
 * tRPC copies it onto its own error, so an erasure's failing query would print the address being
 * erased. Anything else keeps its stack, which is the point of this line. The tRPC route and the
 * MCP tools (lib/mcp/server.ts) log through it.
 */
export const loggableFailure = (error: Error): unknown => {
  const query = queryErrorIn(error);
  return query
    ? {
        name: query.name,
        code: fieldOf(query.cause, "code"),
        constraint: fieldOf(query.cause, "constraint"),
        table: fieldOf(query.cause, "table"),
        column: fieldOf(query.cause, "column"),
        query: query.query,
        // The call frames only: the stack's first lines repeat the message, parameters included.
        frames: (query.stack ?? "")
          .split("\n")
          .filter((line) => line.trimStart().startsWith("at "))
          .join("\n"),
      }
    : error;
};
