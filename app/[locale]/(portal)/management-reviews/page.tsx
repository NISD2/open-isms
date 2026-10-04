import { ManagementReviewsPage } from "@/components/management-reviews/ManagementReviewsPage";
import { RegisterExamples } from "@/components/shared/RegisterExamples";
import { showsExamples } from "@/lib/billing/shows-examples";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function ManagementReviewsRoute() {
  if (await showsExamples()) return <RegisterExamples register="managementReviews" />;
  const items = await api.managementReview.list();
  return (
    <>
      <WalkPlaces register="managementReviews" />
      <ManagementReviewsPage items={items as Record<string, unknown>[]} />
    </>
  );
}
