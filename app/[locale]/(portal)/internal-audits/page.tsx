import { api } from "@/lib/trpc/server";
import { InternalAuditsPage } from "@/components/internal-audits/InternalAuditsPage";

export default async function InternalAuditsRoute() {
  const items = await api.internalAudit.list();
  return <InternalAuditsPage items={items as Record<string, unknown>[]} />;
}
