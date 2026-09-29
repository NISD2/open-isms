/**
 * Next.js calls register() once when a server starts. It starts the jobs that run
 * inside the app rather than on an outside schedule: today only the Close CRM sync,
 * which switches itself off without CLOSE_API_KEY.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { startCloseSyncSchedule } = await import("@/lib/crm/schedule");
  startCloseSyncSchedule();
}
