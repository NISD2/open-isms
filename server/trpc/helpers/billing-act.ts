import { TRPCError } from "@trpc/server";
import type { BillingAct } from "@/lib/billing/account-state";
import type { AccessLevel } from "@/lib/billing/accounts";
import { billingVerdict, refusalMessage } from "@/lib/billing/act-gate";
import type { DbOrTx } from "@/lib/db";

/**
 * Called first by every procedure that signs off (AGB B7): refuses an account that has not ordered,
 * and one inside its money back that has not confirmed giving it up (`billing.waiveMoneyBack`). The
 * company is the procedure's own (`ctx.companyId`), the one its writes are scoped to.
 */
export async function requireBillingAct(
  ctx: {
    readonly db: DbOrTx;
    readonly companyId: string;
    readonly session: {
      readonly accessLevel: AccessLevel | null;
      readonly user: { readonly email?: string | null };
    };
  },
  act: BillingAct,
): Promise<void> {
  const verdict = await billingVerdict(
    ctx.db,
    {
      companyId: ctx.companyId,
      accessLevel: ctx.session.accessLevel,
      user: ctx.session.user,
    },
    act,
  );
  if (verdict.kind === "allow") return;
  throw new TRPCError({
    code: verdict.kind === "order" ? "FORBIDDEN" : "PRECONDITION_FAILED",
    message: refusalMessage(verdict),
  });
}
