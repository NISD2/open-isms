import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { businessPlanData } from "@/lib/business-plan/data";
import { BusinessPlanDashboard } from "./components/BusinessPlanDashboard";

export const dynamic = "force-dynamic";

export default async function BusinessPlanRoute() {
  await requirePlatformAdmin();
  return <BusinessPlanDashboard data={businessPlanData} />;
}
