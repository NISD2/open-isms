import { AssetsPage } from "@/components/assets/AssetsPage";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function AssetsRoute() {
  const assets = await api.asset.list();
  return (
    <>
      <WalkPlaces register="assets" />
      <AssetsPage items={assets as Record<string, unknown>[]} />
    </>
  );
}
