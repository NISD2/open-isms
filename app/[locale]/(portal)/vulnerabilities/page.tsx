import { api } from "@/lib/trpc/server";
import { VulnerabilitiesPage } from "@/components/vulnerabilities/VulnerabilitiesPage";

export default async function VulnerabilitiesRoute() {
  const items = await api.vulnerability.list();
  return <VulnerabilitiesPage items={items as Record<string, unknown>[]} />;
}
