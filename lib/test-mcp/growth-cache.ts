import "@/lib/server-guard";
import type { Database } from "@/lib/db";
import { type GrowthData, loadGrowthData } from "@/lib/platform-admin/growth";

/**
 * `loadGrowthData` reads whole tables into memory. A model asking for stats several times in a
 * row gets the same answer from the last read for a minute instead of a new one each time.
 */
const KEEP_MS = 60_000;

let cached: { readonly at: number; readonly data: Promise<GrowthData> } | null = null;

export function growthData(db: Database): Promise<GrowthData> {
  if (cached && Date.now() - cached.at < KEEP_MS) return cached.data;
  const data = loadGrowthData(db);
  cached = { at: Date.now(), data };
  // A failed read is not kept: the next call tries again.
  data.catch(() => {
    cached = null;
  });
  return data;
}
