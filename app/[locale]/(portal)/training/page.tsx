import { api } from "@/lib/trpc/server";
import { TrainingPage } from "@/components/training/TrainingPage";

export default async function TrainingRoute() {
  const records = await api.training.list();
  return <TrainingPage items={records as Record<string, unknown>[]} />;
}
