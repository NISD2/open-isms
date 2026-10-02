import "@/lib/server-guard";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";

/**
 * The walk's own gates, shared by its home inside the portal and its items beside it: signed
 * in, paid (mayWalkDurchgang; free and grandfathered accounts go to the order page, where a
 * grandfathered person sees their price), and a company that has finished activation, since a
 * draft company has nothing to walk yet.
 *
 * The walk is written in German and English only. Any other locale gets the English walk rather
 * than English text around its own titles and terms.
 */
export async function guardWalk(): Promise<void> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) redirect("/auth/signin");
  if (!mayWalkDurchgang(session.accessLevel, isPlatformAdmin(session.user.email)))
    redirect(getPathname({ href: "/bestellen", locale }));
  if (!session.companyActivated) redirect(getPathname({ href: "/journey", locale }));
  if (locale !== "de" && locale !== "en")
    redirect(getPathname({ href: "/durchgang/nis2", locale: "en" }));
}
