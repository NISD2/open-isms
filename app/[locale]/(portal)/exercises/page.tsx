import { api } from "@/lib/trpc/server";
import { ExercisesPage } from "@/components/exercises/ExercisesPage";

export default async function ExercisesRoute() {
  const exercises = await api.exercise.list();
  return <ExercisesPage items={exercises as Record<string, unknown>[]} />;
}
