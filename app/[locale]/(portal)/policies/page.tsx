import { PoliciesPage } from "@/components/policies/PoliciesPage";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function PoliciesRoute() {
  const policies = await api.policy.list();
  return (
    <>
      <WalkPlaces register="policies" />
      <PoliciesPage items={policies as Record<string, unknown>[]} />
    </>
  );
}
