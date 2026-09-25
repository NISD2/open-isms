/**
 * Platform switches flipped from the platform admin Dev tab. A switch with no row is off.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { featureFlag, featureFlagKeyEnum } from "@/schema";

export type FeatureFlagKey = (typeof featureFlagKeyEnum.enumValues)[number];

export const FEATURE_FLAG_KEYS = featureFlagKeyEnum.enumValues;

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
) => {
  const now = new Date();
  await db
    .insert(featureFlag)
    .values({ key, enabled, updatedAt: now, updatedByUserId: userId })
    .onConflictDoUpdate({
      target: featureFlag.key,
      set: { enabled, updatedAt: now, updatedByUserId: userId },
    });
};

/** Every switch with its state, including the ones never set. */
export const listFeatures = async (db: DbOrTx) => {
  const rows = await db.select().from(featureFlag);
  return FEATURE_FLAG_KEYS.map((key) => {
    const row = rows.find((r) => r.key === key);
    return { key, enabled: row?.enabled ?? false, updatedAt: row?.updatedAt ?? null };
  });
};
