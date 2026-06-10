import { api } from "@/lib/trpc/server";
import { ChangesPage } from "@/components/changes/ChangesPage";

export default async function ChangesRoute() {
  const items = await api.change.list();
  return <ChangesPage items={items as Record<string, unknown>[]} />;
}
