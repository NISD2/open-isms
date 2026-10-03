import { ManagementReviewsPage } from "@/components/management-reviews/ManagementReviewsPage";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function ManagementReviewsRoute() {
  const items = await api.managementReview.list();
  return (
    <>
      <WalkPlaces register="managementReviews" />
      <ManagementReviewsPage items={items as Record<string, unknown>[]} />
    </>
  );
}
