/**
 * The one place that decides what an account holder pays. Every price the customer or a platform
 * admin sees, and every invoice, comes from here: the order page's status and quote, the order
 * itself, and the demo close.
 *
 * Grandfathering belongs to the person (./access), so a grandfathered holder pays 2.400 net on every
 * order, renewal and re-order, even once their account is full. Everyone else pays 4.800.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { isFeatureOn } from "@/lib/feature-flags";
import { user } from "@/schema";
import { isGrandfatheredPerson } from "./access";
import { netCentsFor } from "./order";

/** Whether the holder is grandfathered. No holder (deleted, or nobody yet) is not. */
export const isGrandfatheredHolder = async (
  db: DbOrTx,
  holderUserId: string | null,
): Promise<boolean> => {
  if (!holderUserId) return false;
  const [person] = await db
    .select({
      grandfatheredAt: user.grandfatheredAt,
      emailVerifiedAt: user.emailVerifiedAt,
      loginCount: user.loginCount,
      lastLoginAt: user.lastLoginAt,
    })
    .from(user)
    .where(eq(user.id, holderUserId))
    .limit(1);
  if (!person) return false;
  return isGrandfatheredPerson(person, await isFeatureOn(db, "billing"));
};

/** The yearly net for an account held by this person. */
export const holderNetCents = async (
  db: DbOrTx,
  holderUserId: string | null,
): Promise<number> => netCentsFor(await isGrandfatheredHolder(db, holderUserId));
