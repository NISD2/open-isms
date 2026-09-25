/**
 * Whether billing exists for this person yet: the order page, the billing page, their sidebar entry
 * and the order procedures all ask this one function.
 *
 * It is the launch switch, derived from configuration rather than a flag of its own: closed while
 * Qonto is not configured, platform admins only against the sandbox, everyone once live keys are
 * set (lib/billing/ordering.ts).
 */
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { env } from "@/lib/env";
import { mayOrderIn, orderingMode } from "./ordering";

export const billingFor = (email: string | null | undefined) => {
  const mode = orderingMode(env);
  return { mode, open: mayOrderIn(mode, isPlatformAdmin(email)) };
};
