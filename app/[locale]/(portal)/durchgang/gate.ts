import "@/lib/server-guard";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { opensBeforeSetup } from "@/lib/durchgang";

/**
 * The walk's own gates, for its home, its setup step, its items and management's approval page:
 * signed in, with a company. A company that is not set up yet (the draft every account gets at
 * sign-up) sees the home, walks the registration and sets itself up right after it
 * (`requireWalk` sends it there). Paying is each page's check (`walkAccess`): the home opens to
 * everyone, locked for an account that has not paid.
 *
 * The walk is written in German and English only. Any other locale gets the English walk rather
 * than English text around its own titles and terms.
 */
export async function guardWalk(): Promise<void> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) redirect("/auth/signin");
  // No company at all: the portal's home sets one up.
  if (!session.companyId) redirect(getPathname({ href: "/dashboard", locale }));
  if (locale !== "de" && locale !== "en")
    redirect(getPathname({ href: "/durchgang/nis2", locale: "en" }));
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
 * For the pages past the home, the items and the approval: only an account that may walk. Any
 * other goes back to the home, which shows it the way to order. A company not set up yet may walk
 * the registration (`opensBeforeSetup`, whose screens write into no register); for anything after
 * it, it goes to the setup step: its registers cannot be written before that. `code` is the item
 * asked for; the approval page passes none.
 */
export async function requireWalk(code?: string): Promise<void> {
  const [{ mayWalk }, session, locale] = await Promise.all([
    walkAccess(),
    getSession(),
    getLocale(),
  ]);
  if (!mayWalk) redirect(getPathname({ href: "/durchgang/nis2", locale }));
  if (!session?.companyActivated && !(code !== undefined && opensBeforeSetup(code)))
    redirect(getPathname({ href: "/durchgang/nis2/unternehmen", locale }));
}
