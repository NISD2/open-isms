import { api } from "@/lib/trpc/server";
import { getSession } from "@/lib/auth";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";

export const dynamic = "force-dynamic";

/** The expert statistics surface. Reached deliberately via the header toggle. */
export default async function DashboardStatsRoute() {
  const session = await getSession();

  // Expert stats need a real (activated) company. A draft shell has only seeded
  // 0% data, so steer it to activation rather than an empty statistics surface.
  if (!session?.companyActivated) {
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
