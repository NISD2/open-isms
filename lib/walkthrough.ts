/**
 * Whether the NIS 2 walkthrough is the portal's front for a person: the main page, first in the
 * sidebar, the journey behind a one-time notice, the framework tree out of the sidebar. The
 * `walkthrough` switch in platform admin launches it for everyone; a platform admin sees it
 * before the launch (Simon, 03.10.2026). Read once per request, so the layout, the shell and the
 * walk's gate agree.
 */
import "@/lib/server-guard";
import { cache } from "react";
import { routing } from "@/i18n/routing";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { db } from "@/lib/db";
import { isFeatureOn } from "@/lib/feature-flags";

export const walkthroughLive = cache(
  async (email: string | null | undefined): Promise<boolean> =>
    isPlatformAdmin(email) || (await isFeatureOn(db, "walkthrough")),
);

/** The walk's home as a visitor types it, in every locale: the one walk page an unpaid account opens. */
export const WALK_HOME_PATHS: readonly string[] = [
  ...new Set(Object.values(routing.pathnames["/durchgang/nis2"])),
];
