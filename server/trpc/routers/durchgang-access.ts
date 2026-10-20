import { TRPCError } from "@trpc/server";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { isFreeStep } from "@/lib/durchgang";
import { activatedCompanyProcedure, companyProcedure, type TRPCContext } from "../init";

/**
 * Who may call the Durchgang router. The layout gate is not enough on its own: an API call skips
 * it. So every procedure checks the same rule, paid or platform admin, and resolves the item from
 * the session's company and a fixed list of codes. The first steps (`isFreeStep`) are the
 * exception: an account that has not ordered walks them too.
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

/**
 * The first steps of the walk (`isFreeStep`) are open to an account that has not ordered; every
 * other step is the paid gate's. Called first in each procedure that takes the step's code.
 */
export const gateStep = (session: TRPCContext["session"], stepCode: string) => {
  if (!isFreeStep(stepCode)) gate(session);
};

/** Writes into the company's registers, which need a set-up company like the module routers do. */
export const durchgangWrite = activatedCompanyProcedure.use(({ ctx, next }) => {
  gate(ctx.session);
  return next({ ctx });
});

/** A register write that belongs to one step: open without the order when that step is free. */
export const stepWrite = (stepCode: string) =>
  activatedCompanyProcedure.use(({ ctx, next }) => {
    gateStep(ctx.session, stepCode);
    return next({ ctx });
  });
