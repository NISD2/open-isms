import { routing } from "@/i18n/routing";

/**
 * The walk's home as a visitor types it, in every locale: the one walk page an unpaid account
 * opens. `/durchgang` is its old address, which only redirects here and is in links already sent.
 * `/dashboard` is where sign-in lands, and it opens the walk's home, so an unpaid account signs in
 * to the locked walk rather than to the offer.
 */
export const WALK_HOME_PATHS: readonly string[] = [
  ...new Set([
    "/dashboard",
    "/durchgang",
    ...Object.values(routing.pathnames["/durchgang/nis2"]),
  ]),
];
