import { RegisterExamples } from "@/components/shared/RegisterExamples";
import { TrainingPage } from "@/components/training/TrainingPage";
import { showsExamples } from "@/lib/billing/shows-examples";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function TrainingRoute() {
  if (await showsExamples()) return <RegisterExamples register="training" />;
  const records = await api.training.list();
  return (
    <>
      <WalkPlaces register="training" />
      <TrainingPage items={records as Record<string, unknown>[]} />
    </>
  );
}
