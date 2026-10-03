/**
 * Platform switches. A switch with no row is off. Platform admin lists every one in its Feature
 * flags tab; `billing` is set once by the pricing launch (lib/billing/launch.ts), the rest are
 * flipped there.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { featureFlag, featureFlagKeyEnum, user } from "@/schema";

export type FeatureFlagKey = (typeof featureFlagKeyEnum.enumValues)[number];

/**
 * What each switch does, and whether the Feature flags tab may flip it. A new enum value does not
 * compile until it is described here.
 */
export const FEATURE_FLAGS = {
  billing: {
    label: "Billing",
    description:
      "The paywall for customers. Turned on once by Launch pricing in the Pricing tab, which grandfathers everyone who has got in. Nothing turns it off: grandfathering is a promise made at one moment.",
    toggle: false,
  },
  walkthrough: {
    label: "Walkthrough",
    description:
      "The NIS 2 walkthrough as the portal's front. On, for everyone: the main page after sign-in, first in the sidebar, the journey behind a one-time notice that it is the more detailed view, registers always open, the framework tree out of the sidebar; an unpaid account sees the walkthrough locked with the way to order and has no journey. Off: platform admins see all that, everyone else the journey as before with the walkthrough marked coming soon. Paid accounts can open the walkthrough's address either way.",
    toggle: true,
  },
} as const satisfies Record<
  FeatureFlagKey,
  { readonly label: string; readonly description: string; readonly toggle: boolean }
>;

export const isFeatureOn = async (db: DbOrTx, key: FeatureFlagKey): Promise<boolean> => {
  const [row] = await db
    .select({ enabled: featureFlag.enabled })
    .from(featureFlag)
    .where(eq(featureFlag.key, key))
    .limit(1);
  return row?.enabled ?? false;
};

export const setFeature = async (
  db: DbOrTx,
  key: FeatureFlagKey,
  enabled: boolean,
  userId: string,
  now = new Date(),
) => {
  await db
    .insert(featureFlag)
    .values({ key, enabled, updatedAt: now, updatedByUserId: userId })
    .onConflictDoUpdate({
      target: featureFlag.key,
      set: { enabled, updatedAt: now, updatedByUserId: userId },
    });
};

/** Every switch in the enum, with its state and who last set it; one with no row is off. */
export const listFeatures = async (db: DbOrTx) => {
  const rows = await db
    .select({
      key: featureFlag.key,
      enabled: featureFlag.enabled,
      updatedAt: featureFlag.updatedAt,
      updatedBy: user.email,
    })
    .from(featureFlag)
    .leftJoin(user, eq(user.id, featureFlag.updatedByUserId));
  return featureFlagKeyEnum.enumValues.map((key) => {
    const row = rows.find((r) => r.key === key);
    return {
      key,
      ...FEATURE_FLAGS[key],
      enabled: row?.enabled ?? false,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  });
};
