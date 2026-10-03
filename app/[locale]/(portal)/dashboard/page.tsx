import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { getPathname } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { walkthroughLive } from "@/lib/walkthrough";

export const dynamic = "force-dynamic";

/**
 * `/dashboard` is the portal's home, kept because it is the redirect the rest of the app points at
 * (sign-in, invite accept, password reset, "back to dashboard" links). Once the walkthrough is the
 * portal's front it opens the walkthrough, otherwise the journey (Simon, 03.10.2026).
 */
export default async function DashboardRoute() {
  const session = await getSession();

  if (!session?.companyId) {
    return <OnboardingBanner />;
  }

  if (await walkthroughLive(session.user.email)) {
    redirect(getPathname({ href: "/durchgang/nis2", locale: await getLocale() }));
  }
  redirect("/journey");
}
