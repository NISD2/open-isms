/**
 * The server's check before an export or a sign-off (AGB B7): the state machine's verdict for this
 * session. The page asks the same question first (`billing.acts`) and shows the warning, so a
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

/** Why an act was held back, in the words the API answers with. */
export const refusalMessage = (verdict: Extract<Verdict, { kind: "confirm" }>): string =>
  `This ends the money back (last day ${verdict.lastDay}). Confirm it first.`;

/** The answer a download route gives instead of the file: 409, confirm first. */
export const refusalResponse = (
  verdict: Extract<Verdict, { kind: "confirm" }>,
): Response => new Response(refusalMessage(verdict), { status: 409 });
