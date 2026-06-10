import { api } from "@/lib/trpc/server";
import { AssetsPage } from "@/components/assets/AssetsPage";

export default async function AssetsRoute() {
  const assets = await api.asset.list();
  return <AssetsPage items={assets as Record<string, unknown>[]} />;
}
