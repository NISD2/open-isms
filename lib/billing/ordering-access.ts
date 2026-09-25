/**
 * Whether billing exists for this person yet: the order page, the billing page, their sidebar entry
 * and the order procedures all ask this one function.
 *
 *   - Platform admins: whenever Qonto is configured (sandbox or live), so ordering can be tested
 *     before it is launched.
 *   - Everyone else: only with live Qonto keys AND the `billing` switch on in the platform admin
 *     Dev tab. Setting the keys does not launch anything; flipping the switch does.
 */
import "@/lib/server-guard";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import type { DbOrTx } from "@/lib/db";
import { env } from "@/lib/env";
import { isFeatureOn } from "@/lib/feature-flags";
import { mayOrderIn, orderingMode } from "./ordering";

export const billingFor = async (db: DbOrTx, email: string | null | undefined) => {
  const mode = orderingMode(env);
  const admin = isPlatformAdmin(email);
  if (!mayOrderIn(mode, admin)) return { mode, open: false };
  return { mode, open: admin || (await isFeatureOn(db, "billing")) };
};
