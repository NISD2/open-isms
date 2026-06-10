import { api } from "@/lib/trpc/server";
import { PatchesPage } from "@/components/patches/PatchesPage";

export default async function PatchesRoute() {
  const items = await api.patch.list();
  return <PatchesPage items={items as Record<string, unknown>[]} />;
}
