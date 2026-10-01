/**
 * Next.js calls register() once when a server starts. It starts the jobs that run
 * inside the app rather than on an outside schedule: the daily deadline run and the
 * Close CRM sync. Each one decides for itself whether this is a deployed server.
 *
 * The cheap checks come before the imports, so an instance without Close never
 * loads the CRM code, and a failure to start one schedule is logged instead of
 * stopping the server from booting or the other schedule from starting.
 *
 * The imports sit inside the nodejs branch on purpose. Webpack drops a dynamic
 * import only from a branch it can fold away at compile time; after an early
 * `return` it still bundles the code for the edge runtime, where `fs` does
 * not resolve, and `next dev --webpack` then fails every page with a 500.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NEXT_PHASE === "phase-production-build") return;
    if (process.env.NODE_ENV !== "production") return;
    try {
      const { startDeadlinesSchedule } = await import("@/lib/cron/deadlines-schedule");
      startDeadlinesSchedule();
    } catch (err) {
      console.error("[instrumentation] deadlines schedule not started:", err);
    }
    if (process.env.CLOSE_API_KEY?.trim()) {
      try {
        const { startCloseSyncSchedule } = await import("@/lib/crm/schedule");
        startCloseSyncSchedule();
      } catch (err) {
        console.error("[instrumentation] Close sync schedule not started:", err);
      }
    }
  }
}
