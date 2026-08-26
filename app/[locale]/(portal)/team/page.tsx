import { api } from "@/lib/trpc/server";
import { getSession } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { TeamPage } from "@/components/team/TeamPage";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { getComplianceMessages, getCategoryName } from "@/lib/messages";

export default async function TeamManagementPage() {
  const session = await getSession();
  if (!session?.companyId) redirect("/dashboard");

  const isAdmin = session.role === "admin";
  const [t, compliance, rawMembers, invites] = await Promise.all([
    getTranslations("team"),
    getLocale().then(getComplianceMessages),
    api.team.listMembers(),
    isAdmin ? api.team.listInvites() : [],
  ]);
  const members = rawMembers.map((m) => ({
    ...m,
    assignments: m.assignments.map((a) => ({
      ...a,
      categoryName: getCategoryName(compliance, a.categoryCode),
    })),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        icon={<Users className="h-8 w-8 text-primary" />}
        title={t("pageTitle")}
        description={t("pageDescription")}
      />

      <TeamPage
        members={members}
        invites={invites}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
