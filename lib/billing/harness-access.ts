/**
 * Who may use the billing harness while it is still a harness.
 *
 * Until orders go through an authenticated procedure, the order page and both billing routes are a
 * manual tool for platform admins, and only against the Qonto sandbox. Anyone else, including a
 * logged-in customer, gets a 404, so the harness cannot be used to send invoices to arbitrary
 * addresses or to run VAT lookups under the seller's VAT number.
 *
 * One function for the page and the routes, so the three can never disagree about who is let in.
 */
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { env } from "@/lib/env";
import { isSandboxHarnessEnabled } from "./sandbox-gate";

export const mayUseBillingHarness = async (): Promise<boolean> => {
  if (!isSandboxHarnessEnabled(env)) return false;
  const session = await getSession();
  return isPlatformAdmin(session?.user.email);
};
