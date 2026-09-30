/**
 * Next.js calls register() once when a server starts. It starts the jobs that run
 * inside the app rather than on an outside schedule: today only the Close CRM sync.
 *
 * The cheap checks come before the import, so an instance without Close never
 * loads the CRM code, and a failure to start the schedule is logged instead of
 * stopping the server from booting.
 *
 * The import sits inside the nodejs branch on purpose. Webpack drops a dynamic
 * import only from a branch it can fold away at compile time; after an early
 * `return` it still bundles the CRM code for the edge runtime, where `fs` does
 * not resolve, and `next dev --webpack` then fails every page with a 500.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NEXT_PHASE === "phase-production-build") return;
    if (process.env.NODE_ENV !== "production" || !process.env.CLOSE_API_KEY?.trim())
      return;
    try {
      const { startCloseSyncSchedule } = await import("@/lib/crm/schedule");
      startCloseSyncSchedule();
    } catch (err) {
      console.error("[instrumentation] Close sync schedule not started:", err);
    }
  }
}
