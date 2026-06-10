import { api } from "@/lib/trpc/server";
import { getSession } from "@/lib/auth";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";

export const dynamic = "force-dynamic";

export default async function DashboardRoute() {
  const session = await getSession();

  if (!session?.companyId) {
    return <OnboardingBanner />;
  }

  const [summary, deadlines, complianceProgress] = await Promise.all([
    api.dashboard.summary(),
    api.dashboard.deadlines(),
    api.dashboard.complianceProgress(),
  ]);
  return (
    <DashboardPage
      summary={summary}
      deadlines={deadlines}
      complianceProgress={complianceProgress}
    />
  );
}
