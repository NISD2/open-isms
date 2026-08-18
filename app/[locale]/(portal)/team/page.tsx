import { api } from "@/lib/trpc/server";
import { getSession } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { TeamPage } from "@/components/team/TeamPage";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  getComplianceMessages,
  type ComplianceMessages,
} from "@/lib/messages";

export default async function TeamManagementPage() {
  const session = await getSession();
  if (!session?.companyId) redirect("/dashboard");

  const t = await getTranslations("team");
  const compliance = await getComplianceMessages(await getLocale());
  const isAdmin = session.role === "admin";
  const rawMembers = await api.team.listMembers();
  const members = rawMembers.map((m) => ({
    ...m,
    assignments: m.assignments.map((a) => ({
      ...a,
      categoryName: compliance.compliance.categories[a.categoryCode as keyof ComplianceMessages["compliance"]["categories"]]?.name ?? a.categoryCode,
    })),
  }));
  const invites = isAdmin ? await api.team.listInvites() : [];

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
