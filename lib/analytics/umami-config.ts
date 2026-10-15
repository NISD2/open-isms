/**
 * The analytics settings, as a slice of the environment schema (lib/env.ts), and what the Graphs
 * tab needs from them to read traffic back.
 *
 * Nothing here can fail validation. A wrong analytics setting switches the traffic card off, it
 * never stops the application starting. The tag needs the first two settings (and renders only
 * when both are set); reading needs all four.
 */
import { z } from "zod";
import { trimmed } from "@/lib/env-value";

const optional = z.preprocess(trimmed, z.string().optional());

export const analyticsEnvShape = {
  ANALYTICS_SCRIPT_URL: optional,
  ANALYTICS_WEBSITE_ID: optional,
  /** A view-only Umami login for the Graphs tab. Its own account, never a person's. */
  ANALYTICS_API_USERNAME: optional,
  /** Not trimmed: a password is not ours to edit. */
  ANALYTICS_API_PASSWORD: z.string().optional(),
};

export interface UmamiConfig {
  /** Origin of the analytics host: the one destination the login is ever sent to. */
  readonly baseUrl: string;
  readonly websiteId: string;
  readonly username: string;
  readonly password: string;
}

type AnalyticsEnv = {
  readonly [K in keyof typeof analyticsEnvShape]?: string | undefined;
};

/** Null unless all four settings are present and the host is an https origin. */
export function umamiConfig(env: AnalyticsEnv): UmamiConfig | null {
  const {
    ANALYTICS_SCRIPT_URL,
    ANALYTICS_WEBSITE_ID,
    ANALYTICS_API_USERNAME,
    ANALYTICS_API_PASSWORD,
  } = env;
  if (!ANALYTICS_SCRIPT_URL || !ANALYTICS_WEBSITE_ID) return null;
  if (!ANALYTICS_API_USERNAME || !ANALYTICS_API_PASSWORD) return null;
  const websiteId = z.uuid().safeParse(ANALYTICS_WEBSITE_ID);
  const host = URL.canParse(ANALYTICS_SCRIPT_URL) ? new URL(ANALYTICS_SCRIPT_URL) : null;
  if (!websiteId.success || host === null || host.protocol !== "https:") return null;
  return {
    baseUrl: host.origin,
    websiteId: websiteId.data,
    username: ANALYTICS_API_USERNAME,
    password: ANALYTICS_API_PASSWORD,
  };
}
