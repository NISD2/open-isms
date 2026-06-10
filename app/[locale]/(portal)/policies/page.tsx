import { api } from "@/lib/trpc/server";
import { PoliciesPage } from "@/components/policies/PoliciesPage";

export default async function PoliciesRoute() {
  const policies = await api.policy.list();
  return <PoliciesPage items={policies as Record<string, unknown>[]} />;
}
