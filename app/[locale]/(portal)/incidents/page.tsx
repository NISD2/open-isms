import { api } from "@/lib/trpc/server";
import { IncidentsPage } from "@/components/incidents/IncidentsPage";

export default async function IncidentsRoute() {
  const [incidents, bsiDeadlines] = await Promise.all([
    api.incident.list(),
    api.incident.bsiDeadlines(),
  ]);
  return (
    <IncidentsPage
      items={incidents as Record<string, unknown>[]}
      bsiDeadlines={bsiDeadlines}
    />
  );
}
