import "@/lib/server-guard";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { walkthroughLive } from "@/lib/walkthrough";

/**
 * The walk's own gates, for its home, its items and management's approval page: signed in, and a
 * company that has finished activation, since a draft company has nothing to walk yet. Paying is
 * each page's check (`walkAccess`): the home opens to everyone once the walkthrough is the
 * portal's front, locked for an account that has not paid.
 *
 * The walk is written in German and English only. Any other locale gets the English walk rather
 * than English text around its own titles and terms.
 */
export async function guardWalk(): Promise<void> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) redirect("/auth/signin");
  if (!session.companyActivated) redirect(getPathname({ href: "/journey", locale }));
  if (locale !== "de" && locale !== "en")
    redirect(getPathname({ href: "/durchgang/nis2", locale: "en" }));
}

/**
 * Whether this person may walk (paid, or a platform admin) and whether the walkthrough is the
 * portal's front for them. An unpaid account that may not even see the home goes to the order
 * page, where a grandfathered person sees their price.
 */
export async function walkAccess(): Promise<{ mayWalk: boolean; live: boolean }> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) redirect("/auth/signin");
  const mayWalk = mayWalkDurchgang(
    session.accessLevel,
    isPlatformAdmin(session.user.email),
  );
  const live = await walkthroughLive(session.user.email);
  if (!mayWalk && !live) redirect(getPathname({ href: "/bestellen", locale }));
  return { mayWalk, live };
}

/**
 * For the pages past the home, the items and the approval: only an account that may walk. Any
 * other goes back to the home, which shows it the way to order.
 */
export async function requireWalk(): Promise<void> {
  const { mayWalk } = await walkAccess();
  if (!mayWalk)
    redirect(getPathname({ href: "/durchgang/nis2", locale: await getLocale() }));
}
