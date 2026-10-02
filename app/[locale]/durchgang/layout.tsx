import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AdminTestPanel } from "@/components/portal/AdminTestPanel";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";

/**
 * The Durchgang has no sidebar and no portal header on purpose: one item per
 * screen, the work on the left, the explanation on the right, one way forward.
 * That is why it sits beside the (portal) group instead of inside it, and why
 * it has its own gates: signed in, paid (mayWalkDurchgang; free and
 * grandfathered accounts go to the order page, where a grandfathered person
 * sees their price), and a company that has finished activation, since a draft
 * company has nothing to walk yet.
 *
 * The Durchgang is written in German and English only. Any other locale gets
 * the English walk rather than English text around its own titles and terms.
 */
export default async function DurchgangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) redirect("/auth/signin");
  if (!mayWalkDurchgang(session.accessLevel, isPlatformAdmin(session.user.email)))
    redirect(getPathname({ href: "/bestellen", locale }));
  if (!session.companyActivated) redirect(getPathname({ href: "/journey", locale }));
  if (locale !== "de" && locale !== "en")
    redirect(getPathname({ href: "/durchgang/nis2", locale: "en" }));

  return (
    <>
      {children}
      <AdminTestPanel />
    </>
  );
}
