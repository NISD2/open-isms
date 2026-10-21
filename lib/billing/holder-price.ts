/**
 * Whether the account holder is grandfathered. Grandfathering belongs to the person (./access) and
 * decides what the account falls back to when unpaid. It does not change the price: everyone pays
 * ANNUAL_NET_CENTS (./order).
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { user } from "@/schema";
import { isGrandfatheredPerson } from "./access";

/** Whether the holder is grandfathered. No holder (deleted, or nobody yet) is not. */
export const isGrandfatheredHolder = async (
  db: DbOrTx,
  holderUserId: string | null,
): Promise<boolean> => {
  if (!holderUserId) return false;
  const [person] = await db
    .select({ grandfatheredAt: user.grandfatheredAt })
    .from(user)
    .where(eq(user.id, holderUserId))
    .limit(1);
  return person ? isGrandfatheredPerson(person) : false;
};
