import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";

export const dynamic = "force-dynamic";

/**
 * `/dashboard` is an alias for the journey, kept because it is the home
 * redirect the rest of the app points at (invite accept, password reset,
 * "back to dashboard" links). The journey is the surface.
 */
export default async function DashboardRoute() {
  const session = await getSession();

  if (!session?.companyId) {
    return <OnboardingBanner />;
  }

  redirect("/journey");
}
