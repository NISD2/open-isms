import { api } from "@/lib/trpc/server";
import { KpisPage } from "@/components/kpis/KpisPage";

export default async function KpisRoute() {
  const items = await api.kpi.list();
  return <KpisPage items={items as Record<string, unknown>[]} />;
}
