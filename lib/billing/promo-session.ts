/**
 * A person who is already signed in when they open the promo link gets it at once:
 * nothing else would apply it until their next sign-in, which may fall after the
 * promo's last day. The proxy sets no cookie for them (proxy.ts), so it cannot pass
 * to the next person on the browser. Signed-out visitors go the cookie way instead.
 */
import "@/lib/server-guard";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isActivePromo } from "./promo";
import { grandfatherByPromo } from "./promo-grant";

/** Grandfathers the signed-in person when `code` is the active promo. Never throws. */
export async function applyPromoToSession(code: string | undefined): Promise<void> {
  if (code === undefined || !isActivePromo(code, env)) return;
  try {
    const email = (await getSession())?.user?.email;
    if (email) await grandfatherByPromo(db, email, code);
  } catch (err) {
    console.error("[promo] not applied to the signed-in person:", err);
  }
}
