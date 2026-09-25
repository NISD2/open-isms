/**
 * Launching billing: the moment the paywall goes live for customers (NIS2 plan, slice 5).
 *
 * Runs in one transaction when a platform admin presses "Launch pricing" in the Pricing tab:
 *
 *   1. Every person who has ever got in is stamped `grandfatheredAt`. Grandfathering belongs to the
 *      person: they keep the current journey free in every company they belong to or start later.
 *      "Got in" is the same signal the 0016 backfill used: a verified email, a login count, or a
 *      last login.
 *   2. Every free account with a stamped member or owner becomes grandfathered.
 *   3. The stamped people are frozen into a newsletter group, the audience of the announcement.
 *      A group rather than a query, so it never changes once the launch has happened.
 *   4. The switch goes on.
 *
 * It runs once. The Pricing tab's button is the only caller and refuses once the switch is on, and
 * nothing in the app switches it off again: grandfathering is a promise made at one moment.
 */
import "@/lib/server-guard";
import { and, count, eq, gt, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { setFeature } from "@/lib/feature-flags";
import {
  billingAccount,
  featureFlag,
  newsletterGroup,
  newsletterGroupMember,
  user,
} from "@/schema";

export interface LaunchResult {
  readonly stampedUsers: number;
  readonly accountsGrandfathered: number;
  readonly groupId: string;
  readonly groupMembers: number;
}

const berlinDay = (now: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(now);

/** The announcement group's name starts with this; the Pricing tab finds the group by it. */
const GROUP_PREFIX = "Bestandskonten";

/** What the Pricing tab shows: launched or not, whether it can be, and the announcement group. */
export const pricingState = async (db: DbOrTx, liveKeys: boolean) => {
  const [flag] = await db
    .select({ enabled: featureFlag.enabled, updatedAt: featureFlag.updatedAt })
    .from(featureFlag)
    .where(eq(featureFlag.key, "billing"))
    .limit(1);
  const launched = flag?.enabled ?? false;
  // The group the launch wrote, not any group with a similar name: it carries the launch's own
  // timestamp (launchBilling writes both with the same `now`).
  const [group] =
    launched && flag
      ? await db
          .select({ id: newsletterGroup.id, name: newsletterGroup.name })
          .from(newsletterGroup)
          .where(
            and(
              eq(newsletterGroup.createdAt, flag.updatedAt),
              like(newsletterGroup.name, `${GROUP_PREFIX} %`),
            ),
          )
          .limit(1)
      : [];
  const [members] = group
    ? await db
        .select({ n: count() })
        .from(newsletterGroupMember)
        .where(eq(newsletterGroupMember.groupId, group.id))
    : [];
  return {
    launched,
    launchedAt: launched ? (flag?.updatedAt ?? null) : null,
    liveKeys,
    group: group ? { ...group, members: members?.n ?? 0 } : null,
  };
};

export const launchBilling = async (
  db: DbOrTx,
  byUserId: string,
  now = new Date(),
): Promise<LaunchResult> => {
  const stamped = await db
    .update(user)
    .set({ grandfatheredAt: now })
    .where(
      and(
        isNull(user.grandfatheredAt),
        or(
          isNotNull(user.emailVerifiedAt),
          gt(user.loginCount, 0),
          isNotNull(user.lastLoginAt),
        ),
      ),
    )
    .returning({ id: user.id });

  const moved = await db
    .update(billingAccount)
    .set({ accessLevel: "grandfathered", updatedAt: now })
    .where(
      and(
        eq(billingAccount.accessLevel, "free"),
        sql`(
          EXISTS (
            SELECT 1 FROM "company" c
            JOIN "company_membership" m ON m."company_id" = c."id"
            JOIN "user" u ON u."id" = m."user_id"
            WHERE c."billing_account_id" = ${billingAccount.id} AND u."grandfathered_at" IS NOT NULL
          )
          OR EXISTS (
            SELECT 1 FROM "user" o
            WHERE o."id" = ${billingAccount.ownerUserId} AND o."grandfathered_at" IS NOT NULL
          )
        )`,
      ),
    )
    .returning({ id: billingAccount.id });

  const [group] = await db
    .insert(newsletterGroup)
    .values({
      name: `${GROUP_PREFIX} ${berlinDay(now)}`,
      description:
        "Everyone grandfathered at the billing launch: the audience of the announcement mail.",
      // The same instant as the switch below, which is how pricingState finds this group.
      createdAt: now,
    })
    .returning({ id: newsletterGroup.id });
  if (!group) throw new Error("newsletter group insert returned no row");

  const members = await db
    .insert(newsletterGroupMember)
    .select(
      db
        .select({
          id: sql`gen_random_uuid()`.as("id"),
          groupId: sql`${group.id}::uuid`.as("group_id"),
          userId: user.id,
          addedAt: sql`${now}`.as("added_at"),
        })
        .from(user)
        .where(isNotNull(user.grandfatheredAt)),
    )
    .returning({ id: newsletterGroupMember.id });

  await setFeature(db, "billing", true, byUserId, now);

  return {
    stampedUsers: stamped.length,
    accountsGrandfathered: moved.length,
    groupId: group.id,
    groupMembers: members.length,
  };
};
