import { api } from "@/lib/trpc/server";
import { ManagementReviewsPage } from "@/components/management-reviews/ManagementReviewsPage";

export default async function ManagementReviewsRoute() {
  const items = await api.managementReview.list();
  return <ManagementReviewsPage items={items as Record<string, unknown>[]} />;
}
