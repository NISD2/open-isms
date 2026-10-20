import { ProcessingActivitiesPage } from "@/components/processing-activities/ProcessingActivitiesPage";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/_walk/places";

/** The record of processing activities, with the GDPR walk's step that fills it above. */
export default async function ProcessingActivitiesRoute() {
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
