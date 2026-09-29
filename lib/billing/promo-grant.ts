/**
 * Grandfathering a person who signed in through the promo link (./promo): the same
 * two things the billing launch does for everyone who got in before it (./launch),
 * for this one person. Their grandfatheredAt is stamped, which gives them the free
 * journey and prices their Durchgang at 2.400; and the free billing accounts they
 * own or belong to become grandfathered, as launch step 2 does for any account with
 * a stamped owner or member.
 *
 * Someone already grandfathered is left as they are: the stamp is a promise made
 * once, and its date means something.
 */
import "@/lib/server-guard";
import { and, eq, isNull, sql } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import type { DbOrTx } from "@/lib/db";
import { billingAccount, user } from "@/schema";

/** The audit action of a promo grant; the Pricing tab counts them by it. */
export const PROMO_GRANT_ACTION = "billing.promo_grandfathered";

/** Returns whether this sign-in grandfathered the person. */
export async function grandfatherByPromo(
  db: DbOrTx,
  email: string,
  code: string,
  now: Date = new Date(),
): Promise<boolean> {
  const [stamped] = await db
    .update(user)
    .set({ grandfatheredAt: now, updatedAt: now })
    .where(and(eq(user.email, email), isNull(user.grandfatheredAt)))
    .returning({ id: user.id, companyId: user.companyId });
  if (!stamped) return false;

  const upgraded = await db
    .update(billingAccount)
    .set({ accessLevel: "grandfathered", updatedAt: now })
    .where(
      and(
        eq(billingAccount.accessLevel, "free"),
        sql`(
          ${billingAccount.ownerUserId} = ${stamped.id}
          OR EXISTS (
            SELECT 1 FROM "company" c
            JOIN "company_membership" m ON m."company_id" = c."id"
            WHERE c."billing_account_id" = ${billingAccount.id} AND m."user_id" = ${stamped.id}
          )
        )`,
      ),
    )
    .returning({ id: billingAccount.id });

  logAudit({
    companyId: stamped.companyId,
    userId: stamped.id,
    action: PROMO_GRANT_ACTION,
    entityType: "user",
    entityId: stamped.id,
    description: `Grandfathered through promo code ${code}; ${upgraded.length} free billing account(s) moved to grandfathered`,
  });
  return true;
}
