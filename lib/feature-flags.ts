/**
 * Platform switches. A switch with no row is off. Platform admin lists every one in its Feature
 * flags tab and flips it there.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { featureFlag, featureFlagKeyEnum, user } from "@/schema";

/**
 * Enum values no code reads any more: `billing` (the pricing launch, done) and `walkthrough` (the
 * walkthrough as the portal's front, done). They stay in the database enum, where Postgres cannot
 * drop a value, and their rows stay where they are; they are not switches any more.
 */
const RETIRED = ["billing", "walkthrough"] as const;

type EnumKey = (typeof featureFlagKeyEnum.enumValues)[number];
export type FeatureFlagKey = Exclude<EnumKey, (typeof RETIRED)[number]>;

const isRetired = (key: string): boolean => (RETIRED as readonly string[]).includes(key);

/** Whether `key` names a live switch, one the registry describes. */
export const isFeatureFlagKey = (key: string): key is FeatureFlagKey =>
  featureFlagKeyEnum.enumValues.some((value) => value === key) && !isRetired(key);

interface FeatureFlagInfo {
  readonly label: string;
  readonly description: string;
}

/**
 * What each switch does. A new enum value does not compile until it is described here (or retired
 * above). None is live right now.
 */
export const FEATURE_FLAGS: Readonly<Record<FeatureFlagKey, FeatureFlagInfo>> = {};

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

/** Every live switch, with its state and who last set it; one with no row is off. */
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
  return Object.keys(FEATURE_FLAGS)
    .filter(isFeatureFlagKey)
    .map((key) => {
      const info: FeatureFlagInfo = FEATURE_FLAGS[key];
      const row = rows.find((r) => r.key === key);
      return {
        key,
        label: info.label,
        description: info.description,
        enabled: row?.enabled ?? false,
        updatedAt: row?.updatedAt ?? null,
        updatedBy: row?.updatedBy ?? null,
      };
    });
};
