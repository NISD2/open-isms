import { TrainingPage } from "@/components/training/TrainingPage";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function TrainingRoute() {
  const records = await api.training.list();
  return (
    <>
      <WalkPlaces register="training" />
      <TrainingPage items={records as Record<string, unknown>[]} />
    </>
  );
}
