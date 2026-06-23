import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { isJourneyAllowed } from "@/lib/journey-flag";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";

export const dynamic = "force-dynamic";

export default async function DashboardRoute() {
  const session = await getSession();

  if (!session?.companyId) {
    return <OnboardingBanner />;
  }

  // The journey is the home surface; the expert stats live at /dashboard/stats.
  // Journey-disallowed users (only if the gate is explicitly narrowed) land on
  // the stats instead, so there is no /dashboard <-> /journey redirect loop.
  redirect(
    isJourneyAllowed(session.user.email, env.JOURNEY_ALLOWED_DOMAINS)
      ? "/journey"
      : "/dashboard/stats",
  );
}
