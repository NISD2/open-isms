import { PoliciesPage } from "@/components/policies/PoliciesPage";
import { RegisterExamples } from "@/components/shared/RegisterExamples";
import { showsExamples } from "@/lib/billing/shows-examples";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function PoliciesRoute() {
  if (await showsExamples()) return <RegisterExamples register="policies" />;
  const policies = await api.policy.list();
  return (
    <>
      <WalkPlaces register="policies" />
      <PoliciesPage items={policies as Record<string, unknown>[]} />
    </>
  );
}
