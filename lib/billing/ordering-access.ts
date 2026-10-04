/**
 * Whether this person can order: the order page, the billing page, their sidebar entry and the
 * order procedures all ask this one function.
 *
 *   - Platform admins: whenever Qonto is configured (sandbox or live), so ordering can be tested.
 *   - Everyone else: with live Qonto keys. A deployment without them (a self-hosted instance, a
 *     local run) sells nothing.
 */
import "@/lib/server-guard";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { env } from "@/lib/env";
import { mayOrderIn, orderingMode } from "./ordering";

export const billingFor = (email: string | null | undefined) => {
  const mode = orderingMode(env);
  return { mode, open: mayOrderIn(mode, isPlatformAdmin(email)) };
};
