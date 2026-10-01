import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { DrizzleQueryError } from "drizzle-orm";
import { TRPC_MAX_BATCH_SIZE } from "@/lib/trpc/batch";
import { checkTransport } from "@/lib/trpc/request-guard";
import { createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";

/**
 * Log every failed procedure to the server log.
 *
 * Without this, a refused or crashing mutation is invisible from the outside:
 * the client shows its fallback toast and the container log says nothing at
 * all, so "sign-off fails" could not be told apart from "sign-off is refused
 * because you do not hold the role" without attaching a debugger to a
 * production browser. That is the position we were actually in.
 *
 * The code and the path are the two things that make a report actionable —
 * FORBIDDEN on assessment.signOff is a rule doing its job, INTERNAL_SERVER_
 * ERROR on the same path is a defect. Both are worth a line.
 *
 * Deliberately no `input`: procedure inputs carry requirement answers and
 * other company content, and a log line is the wrong place for it. The stack
 * is kept for unexpected errors only, where it is the whole point, and dropped
 * for the intentional ones, where it is noise. The client gets neither the stack nor an unexpected
 * error's text: the errorFormatter (packages/isms-trpc/src/error-formatter.ts) drops the one and
 * replaces the other, so this log line is the only place the original survives.
 */
/** The first database error in a cause chain, if there is one within a few links. */
const queryErrorIn = (error: unknown, depth = 0): DrizzleQueryError | null =>
  error instanceof DrizzleQueryError
    ? error
    : depth < 4 && error instanceof Error
      ? queryErrorIn(error.cause, depth + 1)
      : null;

const fieldOf = (value: unknown, key: "code" | "constraint") =>
  value && typeof value === "object" && key in value
    ? String((value as Record<string, unknown>)[key])
    : undefined;

/**
 * An unexpected error as the log keeps it. A database failure is logged by name, Postgres code,
 * constraint and query text, never by message: drizzle's message carries the bound parameters, and
 * tRPC copies it onto its own error, so an erasure's failing query would print the address being
 * erased. Anything else keeps its stack, which is the point of this line.
 */
const loggableFailure = (error: Error): unknown => {
  const query = queryErrorIn(error);
  return query
    ? {
        name: query.name,
        code: fieldOf(query.cause, "code"),
        constraint: fieldOf(query.cause, "constraint"),
        query: query.query,
      }
    : error;
};

async function handler(req: Request): Promise<Response> {
  const verdict = checkTransport(req.method, req.headers);
  if (!verdict.ok) {
    console.warn(
      `[trpc] ${req.method} ${new URL(req.url).pathname} refused: ${verdict.status}`,
    );
    return new Response(verdict.message, { status: verdict.status });
  }
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    maxBatchSize: TRPC_MAX_BATCH_SIZE,
    createContext: () => createTRPCContext({ req }),
    onError: ({ error, path, type }) => {
      const where = `${type} ${path ?? "<no path>"}`;
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[trpc] ${where} failed:`, loggableFailure(error));
        return;
      }
      console.warn(`[trpc] ${where} refused: ${error.code} — ${error.message}`);
    },
  });
}

export { handler as GET, handler as POST };
