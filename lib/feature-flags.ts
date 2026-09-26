/**
 * Platform switches. A switch with no row is off. Today there is one, `billing`, set once by the
 * pricing launch in platform admin (lib/billing/launch.ts).
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { featureFlag, type featureFlagKeyEnum } from "@/schema";

export type FeatureFlagKey = (typeof featureFlagKeyEnum.enumValues)[number];

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
