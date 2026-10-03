import { RisksPage } from "@/components/risks/RisksPage";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function RisksRoute() {
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
