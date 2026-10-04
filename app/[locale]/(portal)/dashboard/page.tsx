import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { CompanySetup } from "@/components/organization/CompanySetup";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * `/dashboard` is the portal's home, kept because it is the redirect the rest of the app points at
 * (sign-in, invite accept, password reset, "back to dashboard" links). It opens the walkthrough, the
 * portal's front (Simon, 03.10.2026). A company still being set up goes there too: locked until the
 * account has paid, and then the walk's step after the registration sets it up (Simon, 04.10.2026).
 */
export default async function DashboardRoute() {
  const session = await getSession();

  if (!session?.companyId) {
    return <CompanySetup />;
  }

  redirect(getPathname({ href: "/durchgang/nis2", locale: await getLocale() }));
}
