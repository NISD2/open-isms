/**
 * The server's check before an export or a sign-off (AGB B7, B10): the state machine's verdict for
 * this session. The page asks the same question first (`billing.acts`) and shows the warning, so a
 * refusal here only meets someone who went around the page.
 */
import "@/lib/server-guard";
import type { DbOrTx } from "@/lib/db";
import { type BillingSession, billingStateFor } from "./account-facts";
import { type BillingAct, type Verdict, verdictFor } from "./account-state";

export const billingVerdict = async (
  db: DbOrTx,
  session: BillingSession,
  act: BillingAct,
): Promise<Verdict> => verdictFor(await billingStateFor(db, session), act);

/** Why an act was refused, in the words the API answers with. */
export const refusalMessage = (verdict: Exclude<Verdict, { kind: "allow" }>): string =>
  verdict.kind === "order"
    ? "Exports and sign-offs need an order."
    : `This ends the money back (last day ${verdict.lastDay}). Confirm it first.`;

/** The answer a download route gives instead of the file: 402 to order, 409 to confirm first. */
export const refusalResponse = (verdict: Exclude<Verdict, { kind: "allow" }>): Response =>
  new Response(refusalMessage(verdict), { status: verdict.kind === "order" ? 402 : 409 });
