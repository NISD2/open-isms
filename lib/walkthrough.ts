import { routing } from "@/i18n/routing";
import { WALK_ROUTES, WALKS } from "@/lib/durchgang";

/** A route as a visitor types it, in every locale. */
const typed = (route: keyof typeof routing.pathnames): readonly string[] => {
  const paths = routing.pathnames[route];
  return typeof paths === "string" ? [paths] : Object.values(paths);
};

/**
 * Each walk's home as a visitor types it, in every locale: the walk pages an unpaid account opens.
 * `/durchgang` is the old address, which only redirects to the NIS 2 walk and is in links already
 * sent. `/dashboard` is where sign-in lands, and it opens the NIS 2 walk's home, so an unpaid
 * account signs in to the locked walk rather than to the offer.
 */
export const WALK_HOME_PATHS: readonly string[] = [
  ...new Set([
    "/dashboard",
    "/durchgang",
    ...Object.values(WALKS).flatMap((walk) => typed(WALK_ROUTES[walk.framework].home)),
  ]),
];

/**
 * Every item of every walk as a visitor types it, in every locale, and setting the company up: the
 * walk pages an unpaid account opens besides the homes. The free steps (`isFreeStep`) it walks
 * (Simon, 20.10.2026); any other item opens read only, as its preview, so a link from a course
 * lesson shows the step instead of the offer (Simon, 22.10.2026). Each page decides which
 * (`WalkItem`, `requireWalk`); this only keeps the portal from sending the account to the offer
 * or to the setup form first. The approval page stays out: it is management's act.
 */
export const WALK_ITEM_PATHS: readonly string[] = [
  ...new Set([
    ...typed(WALK_ROUTES.nis2.setup),
    ...Object.values(WALKS).flatMap((walk) =>
      walk.items.flatMap((item) =>
        typed(WALK_ROUTES[walk.framework].item).map((pattern) =>
          pattern.replace("[code]", item.code),
        ),
      ),
    ),
  ]),
];
