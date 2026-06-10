import { api } from "@/lib/trpc/server";
import { ImprovementsPage } from "@/components/improvements/ImprovementsPage";

export default async function ImprovementsRoute() {
  const items = await api.improvement.list();
  return <ImprovementsPage items={items as Record<string, unknown>[]} />;
}
