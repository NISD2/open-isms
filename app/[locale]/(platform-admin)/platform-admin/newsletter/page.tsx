import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";
import { NewsletterAdmin } from "@/components/platform-admin/NewsletterAdmin";

export const dynamic = "force-dynamic";

export default async function NewsletterAdminRoute() {
  await requirePlatformAdmin();

  const [stats, issues, subscribers, groups] = await Promise.all([
    api.newsletter.recipientStats(),
    api.newsletter.listIssues(),
    api.newsletter.listSubscribers(),
    api.newsletter.listGroups(),
  ]);

  return (
    <NewsletterAdmin
      stats={stats}
      issues={issues}
      subscribers={subscribers}
      groups={groups}
    />
  );
}
