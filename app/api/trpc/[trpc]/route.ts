import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
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
        console.error(`[trpc] ${where} failed:`, error);
        return;
      }
      console.warn(`[trpc] ${where} refused: ${error.code} — ${error.message}`);
    },
  });
}

export { handler as GET, handler as POST };
