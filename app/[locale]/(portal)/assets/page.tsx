import { AssetsPage } from "@/components/assets/AssetsPage";
import { RegisterExamples } from "@/components/shared/RegisterExamples";
import { showsExamples } from "@/lib/billing/shows-examples";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function AssetsRoute() {
  if (await showsExamples()) return <RegisterExamples register="assets" />;
  const assets = await api.asset.list();
  return (
    <>
      <WalkPlaces register="assets" />
      <AssetsPage items={assets as Record<string, unknown>[]} />
    </>
  );
}
