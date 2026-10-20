import "@/lib/server-guard";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import {
  isFreeStep,
  NIS2_WALK,
  opensBeforeSetup,
  WALK_ROUTES,
  type Walk,
  walkLocaleOf,
} from "@/lib/durchgang";

/**
 * The walks' own gates, for their homes, setup step, items and management's approval pages:
 * signed in, with a company. A company that is not set up yet (the draft every account gets at
 * sign-up) sees the home, walks the registration and sets itself up right after it
 * (`requireWalk` sends it there). Paying is each page's check (`walkAccess`): the home opens to
 * everyone, locked for an account that has not paid.
 *
 * The NIS 2 walk is written in German, English and Czech. Any other locale gets the English walk
 * rather than English text around its own titles and terms; a walk written in fewer languages
 * checks its own (`guardWalkLocale`).
 */
export async function guardWalk(): Promise<void> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) redirect("/auth/signin");
  // No company at all: the portal's home sets one up.
  if (!session.companyId) redirect(getPathname({ href: "/dashboard", locale }));
  await guardWalkLocale(NIS2_WALK);
}

/** Sends a page language the walk is not written in to the walk's English home. */
export async function guardWalkLocale(walk: Walk): Promise<void> {
  const locale = await getLocale();
  if (walkLocaleOf(locale, walk.locales) !== locale)
    redirect(getPathname({ href: WALK_ROUTES[walk.framework].home, locale: "en" }));
}

/** Whether this person may walk: a paid account, or a platform admin. */
export async function walkAccess(): Promise<{ mayWalk: boolean }> {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  return {
    mayWalk: mayWalkDurchgang(session.accessLevel, isPlatformAdmin(session.user.email)),
  };
}

/**
 * For the pages past a walk's home, the items and the approval: an account that may walk, or, for
 * an account that has not ordered, one of the walk's free steps (`isFreeStep`). Any other goes
 * back to the walk's home, which shows it the way to order. A company not set up yet may walk up
 * to the registration (`opensBeforeSetup`, whose screens write into no register); for anything
 * after it, it goes to the setup step: its registers cannot be written before that. `code` is the
 * item asked for; the approval page passes none. Returns whether the account may walk every step.
 */
export async function requireWalk(walk: Walk, code?: string): Promise<boolean> {
  const [{ mayWalk }, session, locale] = await Promise.all([
    walkAccess(),
    getSession(),
    getLocale(),
  ]);
  const routes = WALK_ROUTES[walk.framework];
  if (!mayWalk && !(code !== undefined && isFreeStep(code)))
    redirect(getPathname({ href: routes.home, locale }));
  if (!session?.companyActivated && !(code !== undefined && opensBeforeSetup(code)))
    redirect(getPathname({ href: routes.setup, locale }));
  return mayWalk;
}
