import { allInvites } from "@/lib/platform-admin/invites";
import { platformAdminProcedure, router } from "../init";

/** Who invited whom, for the platform admin's "Invited users" tab (lib/platform-admin/invites.ts). */
export const platformAdminInvitesRouter = router({
  list: platformAdminProcedure.query(({ ctx }) => allInvites(ctx.db, new Date())),
});
