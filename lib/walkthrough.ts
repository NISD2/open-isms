import { routing } from "@/i18n/routing";
import { isFreeStep, WALK } from "@/lib/durchgang";

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

/**
 * The free steps of the walk (`isFreeStep`) as a visitor types them, in every locale, and setting
 * the company up: the walk pages an unpaid account opens besides the home (Simon, 20.10.2026). Each
 * page still checks the step itself (`requireWalk`); this only keeps the portal from sending the
 * account to the offer first.
 */
export const WALK_FREE_PATHS: readonly string[] = [
  ...new Set([
    ...Object.values(routing.pathnames["/durchgang/nis2/unternehmen"]),
    ...WALK.filter((item) => isFreeStep(item.code)).flatMap((item) =>
      Object.values(routing.pathnames["/durchgang/nis2/[code]"]).map((pattern) =>
        pattern.replace("[code]", item.code),
      ),
    ),
  ]),
];
