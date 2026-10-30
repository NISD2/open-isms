/**
 * Router for checking update status and triggering updates via the updater profile.
 *
 * Gated by platformAdminProcedure so only platform administrators can query update status
 * or initiate container updates.
 */
import { z } from "zod";
import { getUpdateStatus, triggerUpdater } from "@/lib/updates/checker";
import { platformAdminProcedure, router } from "../init";

export const platformAdminUpdatesRouter = router({
  /**
   * Retrieves the current update status.
   * If UPDATE_MODE is "off", returns local version without external network traffic.
   * If UPDATE_MODE is "notify", queries GitHub releases (or returns 24h cached status).
   */
  status: platformAdminProcedure
    .input(
      z
        .object({
          force: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return getUpdateStatus({ force: input?.force });
    }),

  /**
   * Triggers an update via the updater companion container (watchtower).
   * Requires UPDATE_API_TOKEN to be configured.
   */
  trigger: platformAdminProcedure.mutation(async () => {
    return triggerUpdater();
  }),
});
