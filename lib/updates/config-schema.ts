/**
 * Update configuration schema for open-isms.
 *
 * Configures UPDATE_MODE, UPDATE_API_TOKEN, and UPDATER_URL.
 *
 * Modes:
 * - "off" (default): No outbound update traffic. The admin area shows the running version
 *   and links to releases.
 * - "notify": Checks GitHub releases API at most once a day (cached). Compares locally against
 *   APP_VERSION and COMPOSE_REVISION.
 * - "auto": Deliberately not supported for a compliance database to prevent unmonitored migrations
 *   without backup; safely logged and defaulted to "off".
 */
import { z } from "zod";
import { trimmed } from "@/lib/env-value";

export const UPDATE_MODES = ["off", "notify"] as const;
export type UpdateMode = (typeof UPDATE_MODES)[number];

export function normalizeUpdateMode(raw: unknown): UpdateMode {
  const val = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!val || val === "off") return "off";
  if (val === "notify") return "notify";
  if (val === "auto") {
    console.warn(
      "[updates] UPDATE_MODE=auto is not supported: unattended updates to a compliance database are not allowed without backup; falling back to 'off'",
    );
    return "off";
  }
  console.warn(`[updates] Invalid UPDATE_MODE '${String(raw)}', defaulting to 'off'`);
  return "off";
}

export function getUpdateMode(): UpdateMode {
  return normalizeUpdateMode(process.env.UPDATE_MODE);
}

export const updateEnvSchema = z.object({
  UPDATE_MODE: z
    .preprocess(trimmed, z.string().optional())
    .transform(normalizeUpdateMode),
  UPDATE_API_TOKEN: z.preprocess(trimmed, z.string().optional()),
  UPDATER_URL: z.preprocess(
    trimmed,
    z.string().url().default("http://updater:8080/v1/update"),
  ),
});

export const updateEnvShape = updateEnvSchema.shape;
