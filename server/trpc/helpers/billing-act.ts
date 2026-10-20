import { TRPCError } from "@trpc/server";
import type { BillingAct } from "@/lib/billing/account-state";
import type { AccessLevel } from "@/lib/billing/accounts";
import { billingVerdict, refusalMessage } from "@/lib/billing/act-gate";
import type { DbOrTx } from "@/lib/db";

/**
 * Called first by every procedure that signs off (AGB B7): holds back a sign-off inside an order's
 * money back until the person has confirmed giving it up (`billing.waiveMoneyBack`). The company is
 * the procedure's own (`ctx.companyId`), the one its writes are scoped to.
 */
export async function requireBillingAct(
  ctx: {
    readonly db: DbOrTx;
    readonly companyId: string;
    readonly session: { readonly accessLevel: AccessLevel | null };
  },
  act: BillingAct,
): Promise<void> {
  const verdict = await billingVerdict(
    ctx.db,
    { companyId: ctx.companyId, accessLevel: ctx.session.accessLevel },
    act,
  );
  if (verdict.kind === "allow") return;
  throw new TRPCError({ code: "PRECONDITION_FAILED", message: refusalMessage(verdict) });
}
