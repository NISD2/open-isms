/**
 * Grandfathering a person who signed in through the promo link (./promo): what the
 * billing launch did for everyone who got in before it, narrowed to this one
 * person. Their grandfatheredAt is stamped, which gives them the free journey in
 * every company and prices a Durchgang they hold at 2.400; and the free billing
 * accounts they own become grandfathered.
 *
 * Only accounts they own: unlike the launch, which moved an account with any
 * stamped member, a public code must not let a member (a colleague, an outside
 * reviewer) change the level of an account somebody else holds.
 *
 * Both writes happen in one transaction, so a failure leaves nothing half done for
 * the next sign-in to skip. Someone already grandfathered is left as they are: the
 * stamp is a promise made once, and its date means something.
 */
import "@/lib/server-guard";
import { and, eq, isNull } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/lib/db";
import { billingAccount, user } from "@/schema";

/** The audit action of a promo grant; the Pricing tab counts them by it. */
export const PROMO_GRANT_ACTION = "billing.promo_grandfathered";

/** Returns whether this call grandfathered the person. */
export async function grandfatherByPromo(
  db: Database,
  email: string,
  code: string,
  now: Date = new Date(),
): Promise<boolean> {
  const granted = await db.transaction(async (tx) => {
    const [stamped] = await tx
      .update(user)
      .set({ grandfatheredAt: now, updatedAt: now })
      .where(and(eq(user.email, email), isNull(user.grandfatheredAt)))
      .returning({ id: user.id, companyId: user.companyId });
    if (!stamped) return null;
    const upgraded = await tx
      .update(billingAccount)
      .set({ accessLevel: "grandfathered", updatedAt: now })
      .where(
        and(
          eq(billingAccount.accessLevel, "free"),
          eq(billingAccount.ownerUserId, stamped.id),
        ),
      )
      .returning({ id: billingAccount.id });
    return { ...stamped, upgraded: upgraded.length };
  });
  if (!granted) return false;

  logAudit({
    companyId: granted.companyId,
    userId: granted.id,
    action: PROMO_GRANT_ACTION,
    entityType: "user",
    entityId: granted.id,
    description: `Grandfathered through promo code ${code}; ${granted.upgraded} owned free billing account(s) moved to grandfathered`,
  });
  return true;
}
