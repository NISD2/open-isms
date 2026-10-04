import { RisksPage } from "@/components/risks/RisksPage";
import { RegisterExamples } from "@/components/shared/RegisterExamples";
import { showsExamples } from "@/lib/billing/shows-examples";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function RisksRoute() {
  if (await showsExamples()) return <RegisterExamples register="risks" />;
  const [risks, assets] = await Promise.all([api.risk.list(), api.asset.list()]);
  return (
    <>
      <WalkPlaces register="risks" />
      <RisksPage
        items={risks as Record<string, unknown>[]}
        assets={assets as Record<string, unknown>[]}
      />
    </>
  );
}
