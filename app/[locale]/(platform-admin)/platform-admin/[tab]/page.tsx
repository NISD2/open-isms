import { notFound } from "next/navigation";
import { tabOfSlug } from "@/components/platform-admin/admin-tabs";
import { AdminHome } from "../admin-home";

export const dynamic = "force-dynamic";

/**
 * One tab of the platform admin page by its address, such as /platform-admin/active-users. The
 * admin's own pages beside it (metrics, newsletter, advisory, gap-assessment) are static routes
 * and win over this one; a slug that is no tab is not found.
 */
export default async function PlatformAdminTabRoute({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const tab = tabOfSlug((await params).tab);
  if (!tab) notFound();
  return <AdminHome tab={tab} />;
}
