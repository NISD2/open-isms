import { TRPCError } from "@trpc/server";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import type { CountableModule } from "@/lib/compliance/module-tables";
import { type DurchgangAction, walkOfCode } from "@/lib/durchgang";
import { activatedCompanyProcedure, companyProcedure, type TRPCContext } from "../init";
import type { DurchgangActor } from "./durchgang";

/**
 * The procedures every walk router builds on, and what each of them does around a write.
 *
 * The layout gate is not enough on its own: an API call skips it. So every procedure checks the
 * same rule, paid or platform admin, and resolves the item from the session's company and a fixed
 * list of codes.
 */
const gate = (session: TRPCContext["session"]) => {
  if (
    !session ||
    !mayWalkDurchgang(session.accessLevel, isPlatformAdmin(session.user.email))
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "The Durchgang is not part of this plan.",
    });
  }
};

export const durchgangProcedure = companyProcedure.use(({ ctx, next }) => {
  gate(ctx.session);
  return next({ ctx });
});

/** Writes into the company's registers, which need a set-up company like the module routers do. */
export const durchgangWrite = activatedCompanyProcedure.use(({ ctx, next }) => {
  gate(ctx.session);
  return next({ ctx });
});

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
