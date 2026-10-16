import "server-only";
import { and, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { newsletterGroup, newsletterGroupMember } from "@/schema";

/**
 * The DSGVO Durchgang's waitlist: a newsletter group of accounts, so a send to it passes the
 * newsletter's own eligibility gate and carries its unsubscribe link. One fixed id, so the group is
 * created once by whoever joins first, and a platform admin finds it among the newsletter groups.
 */
export const GDPR_WAITLIST = {
  id: "5de5da02-3ac4-4400-9555-e1532afd2429",
  name: "DSGVO Durchgang (Warteliste)",
  description:
    "Accounts that asked, on /vormerken/dsgvo, to be told when the DSGVO Durchgang opens.",
} as const;

const membership = (userId: string) =>
  and(
    eq(newsletterGroupMember.groupId, GDPR_WAITLIST.id),
    eq(newsletterGroupMember.userId, userId),
  );

/** Puts the account on the waitlist; joining twice keeps the first date, which records the ask. */
export async function joinGdprWaitlist(db: DbOrTx, userId: string): Promise<void> {
  await db.insert(newsletterGroup).values(GDPR_WAITLIST).onConflictDoNothing();
  await db
    .insert(newsletterGroupMember)
    .values({ groupId: GDPR_WAITLIST.id, userId })
    .onConflictDoNothing();
}

export async function leaveGdprWaitlist(db: DbOrTx, userId: string): Promise<void> {
  await db.delete(newsletterGroupMember).where(membership(userId));
}

/** When the account joined the waitlist, or null when it is not on it. */
export async function gdprWaitlistSince(
  db: DbOrTx,
  userId: string,
): Promise<Date | null> {
  const [row] = await db
    .select({ addedAt: newsletterGroupMember.addedAt })
    .from(newsletterGroupMember)
    .where(membership(userId))
    .limit(1);
  return row?.addedAt ?? null;
}
