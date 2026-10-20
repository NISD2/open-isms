import { logAudit } from "@/lib/audit";
import { invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import type { CountableModule } from "@/lib/compliance/module-tables";
import { type DurchgangAction, walkOfCode } from "@/lib/durchgang";
import type { TRPCContext } from "../init";
import type { DurchgangActor } from "./durchgang";

/**
 * What every walk router does around a write. Who may call a walk procedure is
 * `routers/durchgang-access`.
 */

/**
 * A register changed: sign-offs that relied on it are rechecked, in the background, as the module
 * routers do. A new or renamed row reverts every framework that reads the register; facts only one
 * item's walk records (`of`, that item's code) revert only that walk's framework.
 */
export const recheck = (
  ctx: { db: TRPCContext["db"]; companyId: string; userId: string },
  module: CountableModule,
  of?: string,
) => {
  const only = of === undefined ? undefined : walkOfCode(of)?.framework;
  return invalidateModuleSignOffs(
    ctx.db,
    ctx.companyId,
    module,
    ctx.userId,
    only ? [only] : undefined,
  ).catch((err) => console.error(`[background] ${module} recheck:`, err));
};

/** The walk's audit entry: its action is one the walk's state and overview know. */
export const logWalk = (
  entry: Parameters<typeof logAudit>[0] & { action: DurchgangAction },
) => logAudit(entry);

export const actorOf = (ctx: {
  companyId: string;
  userId: string;
  session: { role: string };
}): DurchgangActor => ({
  companyId: ctx.companyId,
  userId: ctx.userId,
  role: ctx.session.role,
});
