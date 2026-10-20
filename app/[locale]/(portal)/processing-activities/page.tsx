import { ProcessingActivitiesPage } from "@/components/processing-activities/ProcessingActivitiesPage";
import { RegisterExamples } from "@/components/shared/RegisterExamples";
import { getSession } from "@/lib/auth";
import { showsExamples } from "@/lib/billing/shows-examples";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/_walk/places";

/**
 * The record of processing activities, with the GDPR walk's step that fills it above. An account
 * that must order first sees example rows, as on every register (`EXAMPLE_PORTAL_PATHS`).
 */
export default async function ProcessingActivitiesRoute() {
  if (await showsExamples()) return <RegisterExamples register="processingActivities" />;
  const [items, controller, session] = await Promise.all([
    api.processingActivity.list(),
    api.processingActivity.controller(),
    getSession(),
  ]);
  return (
    <>
      <WalkPlaces register="processingActivities" />
      <ProcessingActivitiesPage
        items={items}
        controller={controller}
        admin={session?.role === "admin"}
      />
    </>
  );
}
