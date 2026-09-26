import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";

/**
 * The Durchgang has no sidebar and no portal header on purpose: one item per
 * screen, the work on the left, the explanation on the right, one way forward.
 * That is why it sits beside the (portal) group instead of inside it, and why
 * it repeats that layout's gates: signed in, paid (lib/billing/access.ts; no
 * Durchgang path is open to a free account, so it goes to the order page), and
 * a company that has finished activation, since a draft company has nothing to
 * walk yet.
 */
export default async function DurchgangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) redirect("/auth/signin");
  if (session.accessLevel === "free")
    redirect(getPathname({ href: "/bestellen", locale }));
  if (!session.companyActivated) redirect(getPathname({ href: "/journey", locale }));

  return <>{children}</>;
}
