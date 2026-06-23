import { api } from "@/lib/trpc/server";
import { getSession } from "@/lib/auth";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";

export const dynamic = "force-dynamic";

/** The expert statistics surface. Reached deliberately via the header toggle. */
export default async function DashboardStatsRoute() {
  const session = await getSession();

  if (!session?.companyId) {
    return <OnboardingBanner />;
  }

  const [summary, complianceProgress] = await Promise.all([
    api.dashboard.summary(),
    api.dashboard.complianceProgress(),
  ]);
  return (
    <DashboardPage summary={summary} complianceProgress={complianceProgress} />
  );
}
