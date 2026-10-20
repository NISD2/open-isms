import "@/lib/server-guard";
import type { Tab } from "@/components/platform-admin/admin-tabs";
import { PlatformAdminPage } from "@/components/platform-admin/PlatformAdminPage";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";

/** The platform admin page, opened on `tab`: /platform-admin and /platform-admin/<slug> alike. */
export async function AdminHome({ tab }: { tab: Tab }) {
  await requirePlatformAdmin();

  const [
    overview,
    users,
    companies,
    complianceActivity,
    trainingActivity,
    supplierActivity,
    emailActivity,
  ] = await Promise.all([
    api.platformAdmin.overview(),
    api.platformAdmin.users(),
    api.platformAdmin.companies(),
    api.platformAdmin.complianceActivity(),
    api.platformAdmin.trainingActivity(),
    api.platformAdmin.supplierActivity(),
    api.platformAdmin.emailActivity(),
  ]);

  return (
    <PlatformAdminPage
      overview={overview}
      users={users}
      companies={companies}
      complianceActivity={complianceActivity}
      trainingActivity={trainingActivity}
      supplierActivity={supplierActivity}
      emailActivity={emailActivity}
      initialTab={tab}
    />
  );
}
